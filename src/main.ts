import { broadcastData, createVisualizerServer, manageConnection, sendData, VisualizerServer } from './visualizerService/sockets';
import { frontEndPort, visualizerPort } from "./config/network-info.json";
import { VisualizerInfo, VisualizerSocketInfo, VisualizerState } from "./models/visualizerInfo/visualizerInfo";
import * as TrackController from './spotifyIO/trackController';
import Synchronizer from './spotifyIO/synchronizer';
import * as api from './spotifyIO/apiController';
import Server from './webserver/server';
import State from './models/state';
import * as colors from './colors';
import { delay } from './utils';
import { isOptionalChain } from 'typescript';
import { stat } from 'fs/promises';
import { beatI, globalTrackI, sectionI } from './models/spotifyApiInterfaces';
require('dotenv').config();


main();

async function main() {
    let verbose = false;
    const state = new State((state: State) => {fireBeat(state);} , verbose);
    const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, state.setAccessToken, verbose);
    const sync = new Synchronizer(state, verbose);
    server.start();
    await api.waitForToken(state);
    sync.initialize(); // The synchronizer needs a working token for it to properly work

    let vizServer: VisualizerServer = createVisualizerServer(state, visualizerPort);
    state.clearVisualizers();
    await state.loadPalettes();
    console.log(state.colorInfo.palettes);
    state.visualizerServerSocket = vizServer;

    if (verbose) {
        console.log("Ready");
    }

    // state.syncVisualizers();
    // await delay(8000);
    // sync.terminate();
    // server.stop();
}

interface colorShiftParams { 
    loudness: number,
    tempo: number
}

function fireBeat(state: State) {
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
            if (visualizer.colorInfo.state == VisualizerState.on) {
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
    refShiftParams : colorShiftParams, shiftWeights: colorShiftParams, timeRatio : number = null): string[] {

    let index =
        Math.floor(
            (Date.now() - visualizer.lastBeatTimestamp) /
                visualizer.colorTickRate
        ) % visualizer.palette.hexColors.length;
    // Color transition function taking loudness info
    let sectionParams: colorShiftParams = {
        loudness: section.loudness,
        tempo: section.tempo
    };

    let color: string = calculateColorShift(visualizer.palette.hexColors[index], 30, sectionParams, refShiftParams, shiftWeights);
    let trans: string[] = colors.makeTimeTransitionOffset(
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
    sectionParams: colorShiftParams, refParams : colorShiftParams, shiftWeights : colorShiftParams): string {

    let shift = initialShift;

    let loudnessMod = (refParams.loudness / sectionParams.loudness - 1) * shiftWeights.loudness;
    let tempoMod = (refParams.tempo / sectionParams.tempo - 1) * shiftWeights.tempo;

    shift = shift + (shift * loudnessMod) + (shift * tempoMod);
    console.log(`Shift of ${shift} | 
        ${shiftWeights.loudness} ${shiftWeights.tempo} | 
        ${loudnessMod} ${tempoMod} | 
        ${sectionParams.loudness} ${sectionParams.tempo} | 
        ${refParams.loudness} ${refParams.tempo}`);
    let color = colors.analogous(startingHexColor, shift);
    // random left or right
    if (Math.random() < (0.5 * (1 + loudnessMod))) {
        return color.left;
    } else {
        return color.right;
    }
}