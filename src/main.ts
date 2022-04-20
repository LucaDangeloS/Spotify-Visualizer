import Server from './server';
import State from './state';
import { frontEndPort, visualizerPort } from "./config/network-info.json";
import { TrackController } from './track_controller';
import Synchronizer from './synchronizer';
import * as api from './api_controller';
require('dotenv').config();


main();


async function main() {
    const state = new State(true);
    const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, state.setAccessToken, true);
    const controller = new TrackController();
    const sync = new Synchronizer(controller, state, true);
    
    await api.waitForToken(state);
    sync.initialize();
    // await delay(8000);
    // sync.terminate();
    
    // setTimeout(()=>{ sync.terminate(); }, 8000);
}