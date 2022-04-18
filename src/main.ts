import Server from './server';
import State from './state';
import { APIFetcher } from './api_controller';
import { frontEndPort, visualizerPort } from "./config/network-info.json";
import { TrackController } from './track_controller';
import Synchronizer from './synchronizer';
require('dotenv').config();


main();


async function main() {
    const state = new State();
    const api = new APIFetcher(process.env.CLIENT_ID, process.env.CLIENT_SECRET);
    const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, api,);
    const controller = new TrackController(state, api);
    const sync = new Synchronizer(api, controller, state);
    
    await api.waitForToken();
    sync.initialize();
    
    // setTimeout(()=>{ sync.terminate(); }, 8000);
}