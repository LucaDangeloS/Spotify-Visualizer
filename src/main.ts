import { createVisualizerServer, manageConnection } from './visualizerService/sockets';
import { frontEndPort, visualizerPort } from "./config/network-info.json";
import { PaletteInfo, VisualizerInfo, VisualizerState } from "./models/visualizerInfo/visualizerInfo";
import * as TrackController from './spotifyIO/trackController';
import Synchronizer from './spotifyIO/synchronizer';
import * as api from './spotifyIO/apiController';
import Server from './webserver/server';
import State from './models/state';
import * as colors from './colors';
import * as sio from "socket.io";
import { delay } from './utils';
import { isOptionalChain } from 'typescript';
require('dotenv').config();


main();

async function main() {
    let verbose = false;
    const state = new State((state: State) => {logBeat(state);} , verbose);
    const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, state.setAccessToken, verbose);
    const sync = new Synchronizer(state, verbose);
    server.start();
    await api.waitForToken(state);
    sync.initialize();

    let vizServer: sio.Server = createVisualizerServer(visualizerPort);
    state.clearVisualizers();
    state.loadPaletteFile();
    
    console.log("Ready");

    vizServer.engine.on("connection_error", (err: any) => {
        console.log("Connection error: " + err);
    })

    vizServer.on('connection', (socket: sio.Socket) => {
        manageConnection(state, socket); 
    });

    // await delay(8000);
    // sync.terminate();
    // server.stop();
}

function logBeat(state: State) {
    // console.log("       " + state.trackInfo.initialTrackProgress/1000 + " " + new Date(state.trackInfo.initialTimestamp));
    console.log("BEAT - " + state.trackInfo.activeBeat?.confidence + " " + Math.floor(state.trackInfo.trackProgress / 1000));
    state.visualizers.forEach(visualizer => {
        let color = colors.complementary(visualizer.palette.hexColors[0]);
        let trans = colors.makeTimeTransitionOffset(visualizer.palette.hexColors, color, 0, 200);
        console.log(`${visualizer.id} - ${visualizer.palette.hexColors[0]}`)
        visualizer.socket.emit('beat', {transition: trans, colors: visualizer.palette.hexColors});
        // if (visualizer.state == VisualizerState.on) {
        //     if (state.trackInfo.activeBeat.confidence >= visualizer.minBeatConf
        //         && state.trackInfo.activeBeat.confidence <= visualizer.maxBeatConf) {
        //             visualizer.socket.emit('beat', "Fire beat");
        //     }
        // }
    });
}
