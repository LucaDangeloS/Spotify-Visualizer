import Server from '../webserver/server';
import State from '../models/state';
import { frontEndPort, visualizerPort } from '../config/network-info.json';
import Synchronizer from '../spotifyIO/synchronizer';
import * as api from '../spotifyIO/apiController';
import * as TrackController from '../spotifyIO/trackController';
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