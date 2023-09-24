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
    let verbose = true;
    const state = new State((state: State) => {fireBeat(state);} , verbose);
    const server = new Server(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, state.setTokenEventHandler, verbose);
    const sync = new Synchronizer(state, verbose);
    server.start();
    await api.waitForToken(state);
    sync.initialize(); // The synchronizer needs a working token for it to properly work
    
    let vizServer: VisualizerServer = createVisualizerServer(state, visualizerPort);
    state.clearVisualizers();
    await state.loadPalettes();
    console.log(state.colorInfo.palettes);
    state.visualizerServerSocket = vizServer;

    // Initialize the API servers
        // They receive the synchronizer and state

    if (verbose) {
        console.log("Ready");
    }

    // set a timeout to terminate the synchronizer if no users are connected
    setInterval(() => {wakeOnUsers(state, sync, 10000)}, 8000);

    // state.syncVisualizers();
    // await delay(8000);
    // sync.terminate();
    // server.stop();
}

// Function that terminates the synchronizer if no users are connected within a certain time
async function wakeOnUsers(state: State, synchronizer: Synchronizer, timeout: number) {
    if (!state.active) {
        synchronizer.terminate();
        return
    } else if (!synchronizer.active && state.visualizers.length > 0) {
        synchronizer.initialize();
        return
    }

    if (synchronizer.active && state.visualizers.length == 0) {
        if (state.lastConnectedVisualizer != null && state.lastConnectedVisualizer.getTime() + timeout < Date.now()) {
            synchronizer.terminate();
        } else if (state.startTime.getTime() + timeout*2 < Date.now()) {
            synchronizer.terminate();
        }
    }
}