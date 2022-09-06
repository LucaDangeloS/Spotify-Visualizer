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

    state.syncVisualizers();
    // await delay(8000);
    // sync.terminate();
    // server.stop();
}

function fireBeat(state: State) {
    // console.log("       " + state.trackInfo.initialTrackProgress/1000 + " " + new Date(state.trackInfo.initialTimestamp));
    // console.log("BEAT - " + state.trackInfo.activeBeat?.confidence + " " + Math.floor(state.trackInfo.trackProgress / 1000));
    if (!state.trackInfo.activeBeat) {
        return;
    }
    let activeBeatConf = state.trackInfo.activeBeat.confidence;
    let activeBeatDur = state.trackInfo.activeBeat.duration;

    if (!state.isSynced) {
        state.visualizers.forEach((visualizer) => {
            if (visualizer.colorInfo.state == VisualizerState.on) {
                if (
                    activeBeatConf >= visualizer.colorInfo.minBeatConf &&
                    activeBeatConf <= visualizer.colorInfo.maxBeatConf
                    ) {
                        let vizDelay = -state.globalDelay - visualizer.delay;
                        let transitionColors = processNextColor( 
                            visualizer.colorInfo,
                            activeBeatDur + vizDelay
                            );
                        sendData(visualizer, transitionColors, visualizer.colorInfo.palette.hexColors, vizDelay);
                        visualizer.colorInfo.lastBeatTimestamp = Date.now();
                    }
                }
        });
    } else {
        let sharedData = state.syncSharedData;
        let transitionColors = processNextColor( 
            sharedData,
            activeBeatDur
        );
        broadcastData(sharedData, transitionColors, state.visualizerServerSocket);
        sharedData.lastBeatTimestamp = Date.now();
    }
}

function processNextColor(visualizer: VisualizerInfo, duration: number): string[] {
    let index =
        Math.floor(
            (Date.now() - visualizer.lastBeatTimestamp) /
                visualizer.colorTickRate
        ) % visualizer.palette.hexColors.length;
    let color = colors.analogous(visualizer.palette.hexColors[index], 30).right;
    let trans = colors.makeTimeTransitionOffset(
        visualizer.palette.hexColors,
        color,
        index,
        duration,
        visualizer.colorTickRate
    );

    return trans;
}