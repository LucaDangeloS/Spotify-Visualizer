import { Socket } from "socket.io"

export interface VisualizerInfo {
    name: string,
    socket: Socket,
    id: string,
    state: VisualizerState,
    palette: {info: PaletteInfo, scale: chroma.Scale, hexColors: string[]},
    delay: number,
    transitionModifier: number,
    cycleModifier: number,
    loudnessSensibility: number,
    minBeatConf: number,
    maxBeatConf: number
}

export enum VisualizerState {
    off,
    cycle,
    visualize
}

export interface PaletteInfo {
    name: string,
    id: string,
    genColors: Array<string>
}

export function newVisualizer(number: number, defaultPalette: PaletteInfo, socket: Socket): VisualizerInfo {
    return {
        name: "Visualizer " + number,
        id: socket.id,
        socket: socket,
        state: VisualizerState.off,
        palette: {
            info: defaultPalette,
            scale: null,
            hexColors: null
        },
        delay: 0,
        transitionModifier: 0,
        cycleModifier: 0,
        loudnessSensibility: 0,
        minBeatConf: 0,
        maxBeatConf: 1
    };
}