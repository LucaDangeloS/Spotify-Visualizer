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
    let verbose = false;
    const state = new State((state: State) => {logBeat(state)} , verbose);
    const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, state.setAccessToken, verbose);
    const sync = new Synchronizer(state, verbose);
    server.start();
    await api.waitForToken(state);
    sync.initialize();
    // await delay(8000);
    // sync.terminate();

    // let c = colors.generateColorPalette(["red", "purple", "blue", "cyan", "green", "orange"]);
    // colors.pc(c.colors(60))
    
}

function logBeat(state: State) {
    console.log("BEAT - " + state.trackInfo.activeBeat?.confidence + " " + Math.floor(state.trackInfo.trackProgress / 1000));
    // console.log("       " + state.trackInfo.initialTrackProgress/1000 + " " + new Date(state.trackInfo.initialTimestamp));
}