import { VisualizerSocket } from "src/server/visualizer/server";
import * as def from 'src/config/defaultVisualizer.json';
import { PaletteDAO } from "src/models/palette/paletteDAO";

export interface VisualizerSocketInfo {
    name: string,
    socket: VisualizerSocket,
    id: string,
    delay: number,
    colorInfo: VisualizerInfo
}


export interface VisualizerInfo {
    state: VisualizerState,
    minBeatConf: number,
    maxBeatConf: number,
    lastBeatTimestamp: number,
    palette: {info: PaletteDAO, scale: chroma.Scale, hexColors: string[]},
    colorTickRate: number // Time in ms that takes for the visualizer to change a color
    transitionModifier: number,
    loudnessSensibility: number,
    tempoSensibility: number,
    cycleModifier: number
}

export enum VisualizerState {
    off,
    cycle,
    on
}

export function newVisualizerColorInfo(palette: PaletteDAO): VisualizerInfo {
    return {
        state: VisualizerState.on,
        minBeatConf: def.minBeatConf,
        maxBeatConf: def.maxBeatConf,
        lastBeatTimestamp: Date.now(),
        palette: {
            info: palette,
            scale: null,
            hexColors: null
        },
        colorTickRate: def.colorTickRate,
        transitionModifier: def.transitionModifier,
        loudnessSensibility: def.loudnessSensibility,
        tempoSensibility: def.tempoSensibility, 
        cycleModifier: def.cycleModifier
    };
}

export function newVisualizer(number: number, defaultPalette: PaletteDAO, socket: VisualizerSocket): VisualizerSocketInfo {
    let colorInfo: VisualizerInfo = newVisualizerColorInfo(defaultPalette);
    return {
        name: `Visualizer ${number}`,
        id: socket.id,
        socket: socket,
        delay: def.delay,
        colorInfo: colorInfo
    };
}