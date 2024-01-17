import { newVisualizer, VisualizerInfo, VisualizerSocketInfo } from '/models/visualizerInfo/visualizerInfo';
import { Server, Socket } from 'socket.io';
import { TransitionData } from './DTO';
import State from '../../models/state';
import 'socket.io';
import { generateHexColors } from './controller';

// Wrapper interfaces
export interface VisualizerServer extends Server {
}

export interface VisualizerSocket extends Socket {
}

export function createVisualizerServer(state: State, port: number): VisualizerServer {
    const server = new Server({pingTimeout: 5000, cors:{origin:'*'}});
    server.listen(port);
    server.on('connection', (socket: Socket) => {
        manageConnection(state, socket); 
    });
    return server;
}

export function manageConnection(state: State, socket: Socket) {
    socket.on('disconnect', (reason: string) => {
        console.log(`Disconnection of socket ${socket.id}`);
        state.removeVisualizer(socket.id);
    });

    const visualizer: VisualizerSocketInfo = newVisualizer(state.visualizers.length, state.colorInfo.defaultPalette, socket);
    visualizer.configInfo.palette.size = state.paletteSize;
    generateHexColors(visualizer.configInfo, state.doublePaletteColors);
    state.addVisualizer(visualizer);
    console.log(`${state.visualizers.length} visualizers connected. Using palette: ${visualizer.configInfo.palette.info.name}`);
    // TODO: Make persistent configuration with a database and a specific event such as 'config'
    sendData(visualizer, [], visualizer.configInfo.palette.hexColors, 0);
}

export function sendData(visualizer: VisualizerSocketInfo, transition: string[], colors: string[], delay: number) {
    // let time = new Date().getTime();
    const data : TransitionData = {
        transition: transition,
        colors: colors || visualizer.configInfo.palette.hexColors,
    }
    visualizer.socket.emit("beat",
        data
    );
}

export function broadcastData(sharedData: VisualizerInfo, transition: string[], server: VisualizerServer) {
    const data : TransitionData = {
        transition: transition,
        colors: sharedData.palette.hexColors,
    }
    server.emit('beat', {
        data
    });
}