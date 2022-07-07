import Server from '../io/server';
import State from '../state';
import { frontEndPort, visualizerPort } from '../config/network-info.json';
import Synchronizer from '../synchronizer';
import * as api from '../io/apiController';
import * as TrackController from '../trackController';
import { delay } from '../utils';
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