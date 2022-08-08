import { createVisualizerServer, manageConnection } from './visualizerService/sockets';
import { frontEndPort, visualizerPort } from "./config/network-info.json";
import { VisualizerInfo, VisualizerState } from "./models/visualizerInfo/visualizerInfo";
import * as TrackController from './spotifyIO/trackController';
import Synchronizer from './spotifyIO/synchronizer';
import * as api from './spotifyIO/apiController';
import Server from './webserver/server';
import State from './models/state';
import * as colors from './colors';
import * as sio from "socket.io";
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

    let vizServer: sio.Server = createVisualizerServer(visualizerPort);
    state.clearVisualizers();
    await state.loadPalettes();
    console.log(state.colorInfo.palettes);
    state.visualizerServerSocket = vizServer;

    if (verbose) {
        console.log("Ready");
    }

    vizServer.on('connection', (socket: sio.Socket) => {
        manageConnection(state, socket); 
    });
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
    let activeBeatDur = state.trackInfo.activeBeat.duration
    let maxLocalDelay = 0;
    
    if (state.sync.isSynced) {
        let trans = processNextColorSync(state.sync.colorArray, activeBeatDur, state.sync.tickrate, state.sync.lastBeatTimestamp)
        state.visualizers.forEach(visualizer => {
            if (visualizer.state == VisualizerState.on) {
                if (activeBeatConf >= visualizer.minBeatConf
                && activeBeatConf <= visualizer.maxBeatConf) {
                    // setTimeout(() => {
                        sendRawData(visualizer, trans, false, state.sync.colorArray)
                    // }, -state.globalDelay - visualizer.delay);
                    // console.log(`[Synced] Delay of ${-state.globalDelay - visualizer.delay}ms set for visualizer: ${visualizer.name}`);

                    // if (visualizer.delay > maxLocalDelay) {
                    //     maxLocalDelay = visualizer.delay;
                    // }
                }
            }
        });
        // state.globalDelay = -maxLocalDelay;
        return;
    }
    state.visualizers.forEach(visualizer => {
        // console.time("Index")
        if (visualizer.state == VisualizerState.on) {
            if (activeBeatConf >= visualizer.minBeatConf
            && activeBeatConf <= visualizer.maxBeatConf) {
                // if (visualizer.delay < -state.globalDelay) {
                    // TODO: Check if data is changed before timeout
                    let trans = processNextColor(visualizer, activeBeatDur + (-state.globalDelay - visualizer.delay));
                        setTimeout(() => {
                            sendData(visualizer, trans)
                        }, -state.globalDelay - visualizer.delay);
                        console.log(`Delay of ${-state.globalDelay - visualizer.delay}ms set for visualizer: ${visualizer.name}`);
                // } else {
                //     let trans = processNextColor(visualizer, activeBeatDur);
                //     sendData(visualizer, trans)
                // }
                if (visualizer.delay > maxLocalDelay) {
                    maxLocalDelay = visualizer.delay;
                }
            }
        }
    });
    console.log(-state.globalDelay);
    state.globalDelay = -maxLocalDelay;
}

function processNextColor(visualizer: VisualizerInfo, duration: number): string[] {
    let index = Math.floor((Date.now() - visualizer.lastBeatTimestamp) / visualizer.colorTickRate) % visualizer.palette.hexColors.length;
    let color = colors.analogous(visualizer.palette.hexColors[index], 30).right;
    let trans = colors.makeTimeTransitionOffset(visualizer.palette.hexColors, color, index, duration, visualizer.colorTickRate);

    return trans;
}

function processNextColorSync(colorArray: string[], duration: number, tickrate: number, lastBeatTimestamp: number): string[] {
    let index = Math.floor((Date.now() - lastBeatTimestamp) / tickrate) % colorArray.length;
    let color = colors.analogous(colorArray[index], 30).right;
    let trans = colors.makeTimeTransitionOffset(colorArray, color, index, duration, tickrate);

    return trans;
}

function sendData(visualizer: VisualizerInfo, transition: string[], log_time: boolean = true, colors: string[] = null) {
    // console.log(`${state.trackInfo.activeSection ? state.trackInfo.activeSection.loudness : null}`)
    let time = new Date().getTime();
    visualizer.socket.emit('beat', {transition: transition, colors: colors ? colors : visualizer.palette.hexColors}, () => {
        if (log_time) {
            const end = Date.now();
            const diff = end - time;
            visualizer.delayArray.push(diff);
            visualizer.delay = calculateMedian(visualizer.delayArray);
        }
    });
    if (log_time) {
        visualizer.lastBeatTimestamp = time;
    }
}

function sendRawData(visualizer: VisualizerInfo, transition: string[], log_time: boolean = true, colors: string[] = null) {
    // console.log(`${state.trackInfo.activeSection ? state.trackInfo.activeSection.loudness : null}`)
    let time = new Date().getTime();
    visualizer.socket.write({transition: transition, colors: colors ? colors : visualizer.palette.hexColors}, () => {
        if (log_time) {
            const end = Date.now();
            const diff = end - time;
            visualizer.delayArray.push(diff);
            visualizer.delay = calculateMedian(visualizer.delayArray);
        }
    });
    if (log_time) {
        visualizer.lastBeatTimestamp = time;
    }
}

function calculateMean(delays: number[]): number {
    // trim array to keep just last 10 results
    delays.splice(0, delays.length - 10);
    let sum = 0;
    delays.forEach(delay => {
        sum += delay;
    });
    return sum / delays.length;
}

function calculateMedian(delays: number[]): number {
    // trim array to keep just last 10 results
    delays.splice(0, delays.length - 10);
    delays.sort((a, b) => {
        return a - b;
    }).slice(0, delays.length / 2);
    return delays[delays.length / 2];
}