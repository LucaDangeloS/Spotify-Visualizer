import { broadcastData, createVisualizerServer, manageConnection, sendData, VisualizerServer } from './visualizer/server';
import { frontEndPort, visualizerPort, socketApiPort } from "./config/network-info.json";
import * as TrackController from './spotify/trackController';
import Synchronizer from './spotify/synchronizer';
import * as api from './spotify/apiController';
import Server from './adminPanel/server';
import State from './models/state';
import { fireBeat } from '/visualizer/colors';
import SocketIOApi from './api/socketio';
require('dotenv').config();

main();

async function main() {
    let verbose = true;
    const state = new State((state: State) => {fireBeat(state);} , verbose);
    const server = new Server(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, state.setTokenEventHandler, verbose);
    const sync = new Synchronizer(state, verbose);
    server.start();
    await api.waitForToken(state);
    // sync.start(); // The synchronizer needs a working token for it to properly work
    
    let vizServer: VisualizerServer = createVisualizerServer(state, visualizerPort);
    state.clearVisualizers();
    await state.loadPalettes();
    console.log(state.colorInfo.palettes);
    state.visualizerServerSocket = vizServer;

    // set a timeout to terminate the synchronizer if no users are connected
    setInterval(() => {wakeOnUsers(state, sync, 10000)}, 8000);

    if (verbose) {
        console.log("Ready");
    }

    // Initialize the API servers
    const socketIOApi = new SocketIOApi(state, sync, socketApiPort, verbose);
    socketIOApi.start();
    

    // state.syncVisualizers();
    // server.stop();
}

// Function that terminates the synchronizer if no users are connected within a certain time
async function wakeOnUsers(state: State, synchronizer: Synchronizer, timeout: number) {
    if (!synchronizer.isAutoControlled) {
        return
    }
    if (!state.active) {
        synchronizer.stop();
        return
    } else if (!synchronizer.active && state.visualizers.length > 0) {
        synchronizer.start();
        return
    }

    if (synchronizer.active && state.visualizers.length == 0) {
        let lastConnectionTime: Date | null = state.lastConnectedVisualizer

        if (lastConnectionTime != null && lastConnectionTime.getTime() + timeout < Date.now()) {
            synchronizer.stop();
        } else if (state.startTime.getTime() + timeout*2 < Date.now()) {
            synchronizer.stop();
        }
    }
}