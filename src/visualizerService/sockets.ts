import { newVisualizer, VisualizerInfo, VisualizerSocketInfo } from '../models/visualizerInfo/visualizerInfo';
import { Server, Socket } from 'socket.io';
import State from '../models/state';
import 'socket.io';
import { generateHexColors } from './visualizerFuncs';

// Wrapper interfaces
export interface VisualizerServer extends Server {
}

export interface VisualizerSocket extends Socket {
}

export function createVisualizerServer(state: State, port: number): VisualizerServer {
    let server = new Server({pingTimeout: 5000, cors:{origin:'*'}});
    server.listen(port);
    server.on('connection', (socket: Socket) => {
        manageConnection(state, socket); 
    });
    return server;
}

export function manageConnection(state: State, socket: Socket) {
    socket.on('disconnect', (reason: string) => {
        console.log("Disconnection of socket " + socket.id);
        state.removeVisualizer(socket.id);
    });

    let visualizer: VisualizerSocketInfo = newVisualizer(state.visualizers.length, state.colorInfo.defaultPalette, socket);
    generateHexColors(visualizer.colorInfo);
    state.addVisualizer(visualizer);
    console.log(state.visualizers.length + " visualizers connected. Using palette: " + visualizer.colorInfo.palette.info.name);
}

export function sendData(visualizer: VisualizerSocketInfo, transition: string[], colors: string[], delay: number) {
    // let time = new Date().getTime();
    visualizer.socket.emit(
        "beat",
        {
            transition: transition,
            colors: colors ? colors : visualizer.colorInfo.palette.hexColors,
        }
    );
}

export function broadcastData(sharedData: VisualizerInfo, transition: string[], server: VisualizerServer) {
    server.emit('beat', {
        transition: transition,
        colors: sharedData.palette.hexColors,
    });
}