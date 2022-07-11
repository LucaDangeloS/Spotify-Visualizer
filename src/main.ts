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
require('dotenv').config();


main();

async function main() {
    let verbose = false;
    const state = new State((state: State) => {logBeat(state);} , verbose);
    // let c = colors.generateColorPalette(["purple", "darkred", "darkblue", "red"]);
    // let cs: string[] = c.colors(50);
    // let paletteInfo: PaletteInfo = {
    //     name: "default",
    //     id: "123",
    //     genColors: ["purple", "darkred", "darkblue", "red"]
    // };
    // state.addPalette(paletteInfo);
    const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, state.setAccessToken, verbose);
    const sync = new Synchronizer(state, verbose);
    server.start();
    await api.waitForToken(state);
    sync.initialize();

    let vizServer: sio.Server = createVisualizerServer(visualizerPort);
    console.log(state.visualizers);
    state.clearVisualizers();
    console.log(state.visualizers);
    vizServer.on('connection', (socket: sio.Socket) => {
    //     console.log("Connected");
    //     socket.emit('beat', "Fire beat");
    //     console.log(vizServer.sockets.adapter.rooms)
    //     await delay(1000);
    //     socket.join('0');
    //     console.log(vizServer.sockets.adapter.rooms)
    //     await delay(2000);
    //     socket.leave('0');
    //     socket.join('200');
    //     vizServer.to("200").emit('beat', "Fire beat");
    //     console.log(vizServer.sockets.adapter.rooms)
    //     socket.disconnect();
        manageConnection(state, socket); 
    });

    // await delay(8000);
    // sync.terminate();
    // let c = colors.generateColorPalette(["#193737", "#354D73", "#CC0605", "#F39F18"]);
    // let cs: string[] = c.colors(100);
    // colors.pc(cs)
    
    // colors.pc(cs)
}

function logBeat(state: State) {
    console.log("BEAT - " + state.trackInfo.activeBeat?.confidence + " " + Math.floor(state.trackInfo.trackProgress / 1000));
    // console.log("       " + state.trackInfo.initialTrackProgress/1000 + " " + new Date(state.trackInfo.initialTimestamp));
    state.visualizers.forEach(visualizer => {
        visualizer.socket.emit('beat', "Fire beat");
        if (visualizer.state == VisualizerState.on) {
            if (state.trackInfo.activeBeat.confidence >= visualizer.minBeatConf
                && state.trackInfo.activeBeat.confidence <= visualizer.maxBeatConf) {
                    visualizer.socket.emit('beat', "Fire beat");
            }
        }
    });
}
