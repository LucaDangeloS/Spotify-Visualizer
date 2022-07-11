import { newVisualizer } from '../models/visualizerInfo/visualizerInfo';
import { Server, Socket } from 'socket.io';
import State from '../models/state';
import 'socket.io';


export function createVisualizerServer(port: number): Server {
    let server = new Server();
    server.listen(port);
    return server;
}

export function manageConnection(state: State, socket: Socket) {
    state.addVisualizer(newVisualizer(state.visualizers.length, state.colorInfo.defaultPalette, socket));
    console.log(state.visualizers.length + " visualizers connected");
}