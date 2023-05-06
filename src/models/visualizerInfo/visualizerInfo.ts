import { VisualizerSocket } from "src/server/visualizer/server";
import * as def from 'src/config/defaultVisualizer.json';
import * as defSynced from 'src/config/sharedVisualizer.json';
import { PaletteDAO } from "src/models/palette/paletteDAO";

export interface VisualizerSocketInfo {
    name: string,
    socket: VisualizerSocket,
    id: string,
    delay: number,
    configInfo: VisualizerInfo
}


export interface VisualizerInfo {
    state: VisualizerState,
    minBeatConf: number,
    maxBeatConf: number,
    lastBeatTimestamp: number,
    palette: {info: PaletteDAO, scale: chroma.Scale, hexColors: string[], size: number},
    colorTickRate: number // Time in ms that takes for the visualizer to change a color
    transitionModifier: number,
    loudnessSensibility: number,
    tempoSensibility: number,
    cycleModifier: number,
    brightness: number
}

export enum VisualizerState {
    off = 0,
    cycle = 1,
    on = 2
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
            hexColors: null,
            size: null
        },
        colorTickRate: def.colorTickRate,
        transitionModifier: def.transitionModifier,
        loudnessSensibility: def.loudnessSensibility,
        tempoSensibility: def.tempoSensibility, 
        cycleModifier: def.cycleModifier,
        brightness: def.brightness
    };
}

export function loadSyncedVisualizerInfo(palette: PaletteDAO): VisualizerInfo {
    return {
        state: VisualizerState.on,
        minBeatConf: defSynced.minBeatConf,
        maxBeatConf: defSynced.maxBeatConf,
        lastBeatTimestamp: Date.now(),
        palette: {
            info: palette,
            scale: null,
            hexColors: null,
            size: null
        },
        colorTickRate: defSynced.colorTickRate,
        transitionModifier: defSynced.transitionModifier,
        loudnessSensibility: defSynced.loudnessSensibility,
        tempoSensibility: defSynced.tempoSensibility, 
        cycleModifier: defSynced.cycleModifier,
        brightness: defSynced.brightness
    };
}

export function newVisualizer(number: number, defaultPalette: PaletteDAO, socket: VisualizerSocket): VisualizerSocketInfo {
    const colorInfo: VisualizerInfo = newVisualizerColorInfo(defaultPalette);
    return {
        name: `Visualizer ${number}`,
        id: socket.id,
        socket: socket,
        delay: def.delay,
        configInfo: colorInfo
    };
}