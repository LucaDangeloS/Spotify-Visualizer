export interface VisualizerInfo {
    name: String,
    id: String,
    state: VisualizerState,
    palette: {info: PaletteInfo, colors: chroma.Scale},
    delay: number,
    transitionFiller: number,
    cycleFilter: number,
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
    name: String,
    id: String,
    genColors: Array<chroma.Color>
}