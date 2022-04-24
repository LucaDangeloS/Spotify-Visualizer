import { frontEndPort, visualizerPort } from "./config/network-info.json";
import * as TrackController from './track_controller';
import Synchronizer from './synchronizer';
import * as api from './api_controller';
import * as colors from './colors';
import { delay } from './utils';
import Server from './server';
import State from './state';
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
    let c = colors.generateColorPalette(["purple", "darkred", "darkblue", "red"]);
    let cs: string[] = c.colors(50);
    // colors.pc(cs)
    
    let idx = Math.random();
    let idxW = Math.round(idx * cs.length);

    let shiftedColor: string = colors.complementary(c(idx));
    let interpolation;

    let startTime = performance.now();
    console.log("Distance Transition")
    for (let i = 0; i < 900; i++) {
        interpolation = colors.makeDistanceTransitionOffset(cs, shiftedColor, idxW, i);
        console.log(interpolation.length);
    }
    console.log("Time transition")
    for (let i = 0; i < 3000; i++) {
        interpolation = colors.makeTimeTransitionOffset(cs, shiftedColor, idxW, i, 5);
        console.log(interpolation.length);  
    }
    
    let endTime = performance.now();

    console.log(`Call took ${endTime - startTime} milliseconds`)
    // colors.getChroma(interpolation);
    // console.log("\n\n");
}

function logBeat(state: State) {
    console.log("BEAT - " + state.trackInfo.activeBeat?.confidence + " " + Math.floor(state.trackInfo.trackProgress / 1000));
    // console.log("       " + state.trackInfo.initialTrackProgress/1000 + " " + new Date(state.trackInfo.initialTimestamp));
}