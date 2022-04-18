import Server from 'server';
import State from 'state';
import { APIFetcher } from 'api_controller';
import { frontEndPort, visualizerPort } from 'config/network-info.json';
import { TrackController } from 'track_controller';
import Synchronizer from 'synchronizer';
require('dotenv').config();


describe('Track controls flow tests', function(){
    const state = new State();
    const api = new APIFetcher(process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, true);
    const controller = new TrackController(state, api);
    const sync = new Synchronizer(api, controller, true);

    test.only('ping test', async () => {
        await api.waitForToken();
        sync.initialize();
        await setTimeout(()=>{ sync.terminate(); }, 4000);
    });
});