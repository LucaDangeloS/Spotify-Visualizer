import { newVisualizer, VisualizerInfo } from '../models/visualizerInfo/visualizerInfo';
import { Server, Socket } from 'socket.io';
import State from '../models/state';
import 'socket.io';
import { generateHexColors } from './visualizerFuncs';


export function createVisualizerServer(port: number): Server {
    let server = new Server();
    server.listen(port);
    return server;
}

export function manageConnection(state: State, socket: Socket) {
    socket.on('disconnect', (reason: string) => {
        console.log("Disconnection of socket " + socket.id);
        state.removeVisualizer(socket.id);
    });
    socket.join(state.syncSocketRoom);
    let visualizer: VisualizerInfo = newVisualizer(state.visualizers.length, state.colorInfo.defaultPalette, socket);
    generateHexColors(visualizer);
    state.addVisualizer(visualizer);
    console.log(state.visualizers.length + " visualizers connected. Using palette: " + visualizer.palette.info.name);
}