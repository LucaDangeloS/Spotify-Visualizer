import { beatI, sectionI } from "src/models/spotifyApiInterfaces";
import { VisualizerInfo, VisualizerState } from "src/models/visualizerInfo/visualizerInfo";
import { broadcastData, sendData } from "./server";
import State from "src/models/state";
import { analogous, lightnessShift, makeTimeTransitionOffset } from "src/models/palette/colors";

interface colorShiftParams { 
    loudness: number,
    tempo: number
}

interface beatParamsInfo {
    activeBeatConf: number,
    activeBeatDur: number,
    colorShiftParams: colorShiftParams
}

export function fireBeat(state: State) {
    // console.log("       " + state.trackInfo.initialTrackProgress/1000 + " " + new Date(state.trackInfo.initialTimestamp));
    // console.log("BEAT - " + state.trackInfo.activeBeat?.confidence + " " + Math.floor(state.trackInfo.trackProgress / 1000));
    if (!state.trackInfo.activeBeat) {
        return;
    }
    const beatInfo = getBeatParamsInfo(state);

    if (!state.isSynced) {
        sendBeat(state, beatInfo);
    } else {
        broadcastBeat(state, beatInfo);
    }
}

function sendBeat(state: State, beatInfo: beatParamsInfo) {
    let shiftWeights : colorShiftParams;

    state.visualizers.forEach((visualizer) => {
        if (visualizer.configInfo.state === VisualizerState.on) {
            if (
                beatInfo.activeBeatConf >= visualizer.configInfo.minBeatConf &&
                beatInfo.activeBeatConf <= visualizer.configInfo.maxBeatConf
                )
                {
                    const vizDelay = -state.globalDelay - visualizer.delay;
                    shiftWeights = {
                        loudness: visualizer.configInfo.loudnessSensibility,
                        tempo: visualizer.configInfo.tempoSensibility
                    }
                    const transitionColors = processNextColor( 
                        visualizer.configInfo,
                        beatInfo.activeBeatDur + vizDelay,
                        state.trackInfo.activeSection,
                        beatInfo.colorShiftParams, 
                        shiftWeights,
                        visualizer.configInfo.baseShiftAlpha,
                        );
                    // Could add some logic to prevent the message to be send if the transition is too short or empty,
                    // but sending it anyway would garantee the visualizer to be in sync
                    sendData(visualizer, transitionColors, visualizer.configInfo.palette.hexColors, vizDelay);
                    visualizer.configInfo.lastBeatTimestamp = Date.now();
                }
            }
    });
}

function broadcastBeat(state: State, beatInfo: beatParamsInfo) {
    const sharedData = state.syncSharedData;

    if (beatInfo.activeBeatConf < sharedData.minBeatConf || beatInfo.activeBeatConf > sharedData.maxBeatConf) {
        return;
    }

    const shiftWeights : colorShiftParams = {
        loudness: sharedData.loudnessSensibility,
        tempo: sharedData.tempoSensibility
    };

    const transitionColors = processNextColor( 
        sharedData,
        beatInfo.activeBeatDur,
        state.trackInfo.activeSection,
        beatInfo.colorShiftParams, 
        shiftWeights,
    );
    broadcastData(sharedData, transitionColors, state.visualizerServerSocket);
    sharedData.lastBeatTimestamp = Date.now();
}

function getBeatParamsInfo(state: State): beatParamsInfo {
    const activeBeat: beatI = state.trackInfo.activeBeat;
    const activeBeatConf = activeBeat.confidence;
    const activeBeatDur = activeBeat.duration;
    const colorShiftParams: colorShiftParams = {
        loudness: state.trackInfo.meanLoudness,
        tempo: state.trackInfo.meanTempo
    }

    return {
        activeBeatConf,
        activeBeatDur,
        colorShiftParams
    }
}

function processNextColor(visualizer: VisualizerInfo, duration: number, section: sectionI, 
    refShiftParams : colorShiftParams, shiftWeights: colorShiftParams, baseShiftAlpha: number = 30, timeRatio : number = null, mode: "hue"|"lightness"|"both" = "both"): string[] {

    const index =
        Math.floor(
            (Date.now() - visualizer.lastBeatTimestamp) /
                visualizer.colorTickRate
        ) % visualizer.palette.hexColors.length;
    console.log(index);
    // Color transition function taking loudness info
    let sectionParams: colorShiftParams|null = null;
    if (section) {
        sectionParams = {
            loudness: section.loudness,
            tempo: section.tempo
        };
    }

    let baseColor: string = visualizer.palette.hexColors[index];
    let color: string;

    // TODO: Calculate the final shift here and pass it directly to the color transition function, also could be used to determine the 
    // type of transition to be used

    let shift = baseShiftAlpha;
    if (sectionParams) {
        const loudnessMod = (refShiftParams.loudness / sectionParams.loudness - 1) * shiftWeights.loudness;
        const tempoMod = (refShiftParams.tempo / sectionParams.tempo - 1) * shiftWeights.tempo;
        shift = shift + (shift * loudnessMod) + (shift * tempoMod);
        console.log(`Shift of ${shift.toFixed(2)}º | L T |
            shift weights   ${shiftWeights.loudness.toFixed(2)} ${shiftWeights.tempo.toFixed(2)} | 
            mods            ${loudnessMod.toFixed(2)} ${tempoMod.toFixed(2)} | 
            section params  ${sectionParams.loudness.toFixed(2)} ${sectionParams.tempo.toFixed(2)} | 
            ref params      ${refShiftParams.loudness.toFixed(2)} ${refShiftParams.tempo.toFixed(2)}`);
    }

    if (mode == "both") {
        if (shift > baseShiftAlpha) {
            color = calculateColorShift(baseColor, shift);
        } else {
            color = calculateLightnessShift(baseColor, shift);
        }
    } else if (mode === "hue") {
        color = calculateColorShift(baseColor, shift);
    } else if (mode === "lightness") {
        color = calculateLightnessShift(baseColor, shift);
    }
    
    if (baseColor === color) {
        return [];
    }

    const trans: string[] = makeTimeTransitionOffset(
        visualizer.palette.hexColors,
        color,
        index,
        duration,
        visualizer.colorTickRate,
        timeRatio
    );

    return trans;
}

function calculateColorShift(startingHexColor: string, shift: number): string {
    // Fix negative angles, maybe do it logarithmically
    // Try to find a better way to detect chorus
    if (shift < 0) {
        return startingHexColor;
    }
    const color = analogous(startingHexColor, shift);
    // TODO: Add option to choose
    // random left or righ
    return color.left;
    // if (Math.random() < (0.5 * (1 + loudnessMod))) {
        // return color.left;
    // } else {
        // return color.right;
    // }
}

function calculateLightnessShift(startingHexColor: string, shift: number): string {
    // Fix negative angles, maybe do it logarithmically
    // Try to find a better way to detect chorus
    if (shift < 0) {
        return startingHexColor;
    }
    
    const color = lightnessShift(startingHexColor, shift / 100);
    return color;
}