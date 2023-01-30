import Server from '../src/server/adminPanel/server';
import State from '../src/models/state';
import { frontEndPort, visualizerPort } from '../src/config/network-info.json';
import Synchronizer from '../src/spotify/synchronizer';
import * as api from '../src/spotify/apiController';
import * as TrackController from '../src/spotify/trackController';
import { delay } from '../src/spotify/utils';
require('dotenv').config();


describe('Track controls flow tests', function() {
    let state = new State();
    const sync = new Synchronizer(state, false);

    test('ping test', async () => {
        await api.waitForToken(state);
        sync.initialize();
        await delay(6000);
        sync.terminate();
    }, 16000);
});