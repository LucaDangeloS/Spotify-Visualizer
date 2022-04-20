import Server from 'server';
import State from 'state';
import { APIFetcher } from 'api_controller';
import { frontEndPort, visualizerPort } from 'config/network-info.json';
import { TrackController } from 'track_controller';
import Synchronizer from 'synchronizer';
import * as api from 'api_controller';
import { delay } from 'utils';
require('dotenv').config();


describe('Track controls flow tests', function() {
    let state = new State();
    const controller = new TrackController(false);
    const sync = new Synchronizer(controller, state, false);

    test('ping test', async () => {
        await api.waitForToken(state);
        sync.initialize();
        await delay(2000);
        sync.terminate();
    });
});