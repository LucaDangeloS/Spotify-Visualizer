import { VisualizerSocket } from "/visualizer/server";
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

export const VisualizerState = {
    "off": 0,
    "cycle": 1,
    "on": 2
} as const;
export type VisualizerStateT = typeof VisualizerState[keyof typeof VisualizerState]

export interface VisualizerInfo {
    state: VisualizerStateT,
    lastBeatTimestamp: number,
    palette: {info: PaletteDAO, scale: chroma.Scale, hexColors: string[], size: number},
    brightness: number,
    
    // Beat modifiers
    minBeatConf: number,
    maxBeatConf: number,
    
    // Transition modifiers
    baseShiftAlpha: number,
    transitionModifier: number,
    loudnessSensibility: number,
    tempoSensibility: number,
    cycleModifier: number,
    colorTickRate: number // Time in ms that takes for the visualizer to change a color
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
        brightness: def.brightness,
        baseShiftAlpha: def.baseShiftAlpha
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
        brightness: defSynced.brightness,
        baseShiftAlpha: defSynced.baseShiftAlpha
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