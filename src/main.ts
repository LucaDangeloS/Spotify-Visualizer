import { frontEndPort, visualizerPort } from "./config/network-info.json";
import * as TrackController from './track_controller';
import Synchronizer from './synchronizer';
import * as api from './api_controller';
import * as colors from './colors';
import { delay } from './utils';
import Server from './server';
import State from './state';
import { makeDistanceTransitionOffset } from "./colors";
require('dotenv').config();


main();

async function main() {
    // let verbose = false;
    // const state = new State((state: State) => {logBeat(state)} , verbose);
    // const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, state.setAccessToken, verbose);
    // const sync = new Synchronizer(state, verbose);
    // server.start();
    // await api.waitForToken(state);
    // sync.initialize();
    // await delay(8000);
    // sync.terminate();
    let test_colorset = ["red", "purple", "blue", "cyan", "green", "orange"]
    let c = colors.generateColorPalette(["purple", "darkred", "darkblue", "red"]);
    let transitionFunc = makeDistanceTransitionOffset;
    let cs: string[] = c.colors(50);
    // colors.pc(cs)
    
    let idx = Math.random();
    let idx2 = Math.random();
    let idxW = Math.round(idx * cs.length);
    let idx2W = Math.round(idx2 * cs.length);

    let shiftedColor: string = colors.analogous(c(idx), 60).right;
    
    let startTime = performance.now();

    let interpolation = transitionFunc(cs, shiftedColor, idxW);
    // let interpolation2 = transitionFunc(cs, shiftedColor2, idx2W);
    
    let endTime = performance.now();

    console.log(`Call took ${endTime - startTime} milliseconds`)
    // colors.getChroma(interpolation);
    // console.log("\n\n");
    let chromas = colors.splitChroma(cs, 22);
    colors.pc(chromas.underThreshold);
    console.log("\n\n");
    colors.pc(chromas.overThreshold);
    // colors.pc(interpolation);
    // colors.pc(cs);
    // console.log(idxW + " " + c(idx));
    // console.log(idx2W + " " + c(idx2));
}

function logBeat(state: State) {
    console.log("BEAT - " + state.trackInfo.activeBeat?.confidence + " " + Math.floor(state.trackInfo.trackProgress / 1000));
    // console.log("       " + state.trackInfo.initialTrackProgress/1000 + " " + new Date(state.trackInfo.initialTimestamp));
}