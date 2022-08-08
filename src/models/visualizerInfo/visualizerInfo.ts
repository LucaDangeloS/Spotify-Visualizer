import { Socket } from "socket.io"
import * as def from "../../config/defaultVisualizer.json";
import { PaletteDAO } from "../palette/paletteDAO";

export interface VisualizerInfo {
    name: string,
    socket: Socket,
    colorTickRate: number // Time in ms that takes for the visualizer to change a color,
    lastBeatTimestamp: number,
    id: string,
    state: VisualizerState,
    palette: {info: PaletteDAO, scale: chroma.Scale, hexColors: string[]},
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
    on
}

export function newVisualizer(number: number, defaultPalette: PaletteDAO, socket: Socket): VisualizerInfo {
    return {
        name: "Visualizer " + number,
        id: socket.id,
        socket: socket,
        state: VisualizerState.on,
        colorTickRate: def.colorTickRate,
        lastBeatTimestamp: Date.now(),
        palette: {
            info: defaultPalette,
            scale: null,
            hexColors: null
        },
        delay: def.delay,
        transitionModifier: def.transitionModifier,
        cycleModifier: def.cycleModifier,
        loudnessSensibility: def.loudnessSensibility,
        minBeatConf: def.minBeatConf,
        maxBeatConf: def.maxBeatConf
    };
}