import State from "../src/models/state";
import Synchronizer from "../src/spotify/synchronizer";
import SocketIOApi from "../src/server/api/socketio";
import { socketApiPort } from '../src/config/network-info.json';
import { delay } from "../src/spotify/utils";


describe('Socket API tests', function() {

    let state = new State();
    const sync = new Synchronizer(state, false);
    const apiServer = new SocketIOApi(state, sync, socketApiPort);
    apiServer.start();

    // Create a socket client
    const io = require('socket.io-client');
    const socket = io(`http://localhost:${socketApiPort}`);

    test('Server start/stop', async () => {
        socket.emit('start');
        await delay(500);
        expect(sync.active).toBe(true);
        socket.emit('shutdown');
        await delay(500);
        expect(sync.active).toBe(false);
    }, 4000);
    

    afterAll(() => {
        apiServer.stop();
        socket.close();
    });
});