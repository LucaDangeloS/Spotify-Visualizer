import Server from './server';
import State from './state';
import { APIFetcher } from './api_controller';
import { frontEndPort, visualizerPort } from "./config/network-info.json";
import { TrackController } from './track_controller';
require('dotenv').config();

const state = new State();
const api = new APIFetcher(process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, true);
const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, api, true);
const controller = new TrackController(state, api);
server.start();

async function main() {
    await api.waitForToken();
    await api.fetchCurrentlyPlaying();
    // setTimeout(()=>{ controller.ping(); }, 1000);
}

// main();
