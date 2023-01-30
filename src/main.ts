import { broadcastData, createVisualizerServer, manageConnection, sendData, VisualizerServer } from '/server/visualizer/server';
import { frontEndPort, visualizerPort } from "./config/network-info.json";
import * as TrackController from './spotify/trackController';
import Synchronizer from './spotify/synchronizer';
import * as api from './spotify/apiController';
import Server from './server/adminPanel/server';
import State from './models/state';
import { fireBeat } from 'src/server/visualizer/colors';
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
