import { VisualizerSocket } from "src/visualizerService/sockets";
import * as def from "../../config/defaultVisualizer.json";
import { PaletteDAO } from "../palette/paletteDAO";

export interface VisualizerInfo {
    name: string,
    socket: VisualizerSocket,
    id: string,
    delay: number,
    colorInfo: VisualizerColorInfo
}


export interface VisualizerColorInfo {
    state: VisualizerState,
    minBeatConf: number,
    maxBeatConf: number,
    lastBeatTimestamp: number,
    palette: {info: PaletteDAO, scale: chroma.Scale, hexColors: string[]},
    colorTickRate: number // Time in ms that takes for the visualizer to change a color
    transitionModifier: number,
    loudnessSensibility: number,
    cycleModifier: number
}

export enum VisualizerState {
    off,
    cycle,
    on
}

export function newVisualizerColorInfo(defaultPalette: PaletteDAO): VisualizerColorInfo {
    return {
        state: VisualizerState.on,
        minBeatConf: def.minBeatConf,
        maxBeatConf: def.maxBeatConf,
        lastBeatTimestamp: Date.now(),
        palette: {
            info: defaultPalette,
            scale: null,
            hexColors: null
        },
        colorTickRate: def.colorTickRate,
        transitionModifier: def.transitionModifier,
        loudnessSensibility: def.loudnessSensibility,
        cycleModifier: def.cycleModifier
    };
}

export function newVisualizer(number: number, defaultPalette: PaletteDAO, socket: VisualizerSocket): VisualizerInfo {
    let colorInfo: VisualizerColorInfo = newVisualizerColorInfo(defaultPalette);
    return {
        name: "Visualizer " + number,
        id: socket.id,
        socket: socket,
        delay: def.delay,
        colorInfo: colorInfo
    };
}