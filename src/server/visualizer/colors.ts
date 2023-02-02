import { beatI, sectionI } from "src/models/spotifyApiInterfaces";
import { VisualizerInfo, VisualizerState } from "src/models/visualizerInfo/visualizerInfo";
import { broadcastData, sendData } from "./server";
import State from "src/models/state";
import { analogous, makeTimeTransitionOffset } from "src/models/palette/colors";

interface colorShiftParams { 
    loudness: number,
    tempo: number
}

export function fireBeat(state: State) {
    // console.log("       " + state.trackInfo.initialTrackProgress/1000 + " " + new Date(state.trackInfo.initialTimestamp));
    // console.log("BEAT - " + state.trackInfo.activeBeat?.confidence + " " + Math.floor(state.trackInfo.trackProgress / 1000));
    if (!state.trackInfo.activeBeat) {
        return;
    }
    let activeBeat: beatI = state.trackInfo.activeBeat;
    let activeBeatConf = activeBeat.confidence;
    let activeBeatDur = activeBeat.duration;

    let colorShiftParams: colorShiftParams = {
        loudness: state.trackInfo.meanLoudness,
        tempo: state.trackInfo.meanTempo
    }
    let shiftWeights : colorShiftParams;


    if (!state.isSynced) {
        state.visualizers.forEach((visualizer) => {
            if (visualizer.colorInfo.state === VisualizerState.on) {
                if (
                    activeBeatConf >= visualizer.colorInfo.minBeatConf &&
                    activeBeatConf <= visualizer.colorInfo.maxBeatConf
                    ) {
                        let vizDelay = -state.globalDelay - visualizer.delay;
                        shiftWeights = {
                            loudness: visualizer.colorInfo.loudnessSensibility,
                            tempo: visualizer.colorInfo.tempoSensibility
                        }
                        let transitionColors = processNextColor( 
                            visualizer.colorInfo,
                            activeBeatDur + vizDelay,
                            state.trackInfo.activeSection,
                            colorShiftParams, 
                            shiftWeights
                            );
                        sendData(visualizer, transitionColors, visualizer.colorInfo.palette.hexColors, vizDelay);
                        visualizer.colorInfo.lastBeatTimestamp = Date.now();
                    }
                }
        });
    } else {
        let sharedData = state.syncSharedData;
        shiftWeights = {
            loudness: sharedData.loudnessSensibility,
            tempo: sharedData.tempoSensibility
        }

        let transitionColors = processNextColor( 
            sharedData,
            activeBeatDur,
            state.trackInfo.activeSection,
            colorShiftParams, 
            shiftWeights
        );
        broadcastData(sharedData, transitionColors, state.visualizerServerSocket);
        sharedData.lastBeatTimestamp = Date.now();
    }
}

function processNextColor(visualizer: VisualizerInfo, duration: number, section: sectionI, 
    refShiftParams : colorShiftParams, shiftWeights: colorShiftParams, baseShiftAlpha: number = 30, timeRatio : number = null): string[] {

    let index =
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

    let color: string = calculateColorShift(visualizer.palette.hexColors[index], baseShiftAlpha, sectionParams, refShiftParams, shiftWeights);
    let trans: string[] = makeTimeTransitionOffset(
        visualizer.palette.hexColors,
        color,
        index,
        duration,
        visualizer.colorTickRate,
        timeRatio
    );

    return trans;
}

function calculateColorShift(startingHexColor: string, initialShift: number, 
    sectionParams: colorShiftParams|null, refParams : colorShiftParams, shiftWeights : colorShiftParams): string {
    // Fix negative angles, maybe do it logarithmically
    // Try to find a better way to detect chorus
    let shift = initialShift;
    if (!sectionParams) {
        return analogous(startingHexColor, shift).left;
    }
    let loudnessMod = (refParams.loudness / sectionParams.loudness - 1) * shiftWeights.loudness;
    let tempoMod = (refParams.tempo / sectionParams.tempo - 1) * shiftWeights.tempo;

    shift = shift + (shift * loudnessMod) + (shift * tempoMod);
    console.log(`Shift of ${shift} | 
        ${shiftWeights.loudness} ${shiftWeights.tempo} | 
        ${loudnessMod} ${tempoMod} | 
        ${sectionParams.loudness} ${sectionParams.tempo} | 
        ${refParams.loudness} ${refParams.tempo}`);
    if (shift < 0) {
        return startingHexColor;
    }
    let color = analogous(startingHexColor, shift);
    // random left or right
    return color.left;
    // if (Math.random() < (0.5 * (1 + loudnessMod))) {
        // return color.left;
    // } else {
        // return color.right;
    // }
}