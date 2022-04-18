import Server from 'server';
import State from 'state';
import { APIFetcher } from 'api_controller';
import { frontEndPort, visualizerPort } from 'config/network-info.json';
import { TrackController } from 'track_controller';
import Synchronizer from 'synchronizer';
import { delay } from 'utils';
require('dotenv').config();


describe('Track controls flow tests', function() {
    const state = new State();
    const api = new APIFetcher(process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, false);
    const controller = new TrackController(state, api, false);
    const sync = new Synchronizer(api, controller, false);

    test('ping test', async () => {
        await api.waitForToken();
        sync.initialize();
        sync.terminate();
    });
});