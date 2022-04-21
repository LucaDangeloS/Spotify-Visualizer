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
    const state = new State(true,  (state: State) => { console.log("BEAT - " + state.trackInfo.activeBeat.confidence + " " + state.trackInfo.activeBeatIndex) });
    const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, state.setAccessToken, true);
    const sync = new Synchronizer(state, true);
    await api.waitForToken(state);
    sync.initialize();
    // await delay(8000);
    // sync.terminate();

    let c = colors.generateColorPalette(["red", "purple", "blue", "cyan", "green", "orange"]);
    colors.pc(c.colors(60))
    
}