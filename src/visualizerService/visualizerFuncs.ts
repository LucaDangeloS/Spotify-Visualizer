import { VisualizerColorInfo, VisualizerInfo, VisualizerState } from "../models/visualizerInfo/visualizerInfo";
import { colorPaletteSize } from "../config/config.json";
import { generateColorPalette } from "../colors";
import { NoPaletteDefinedError, NullNameError, NullPaletteError, ValueOutOfBoundsError } from "./visualizerErrors";
import { PaletteDAO } from "src/models/palette/paletteDAO";


export function updateDelay(viz: VisualizerInfo, delay: number): void {
    if (delay >= 0) {
        viz.delay = delay;
    } else {
        throw new ValueOutOfBoundsError(viz, 0, 1000);
    }
}

export function updateTransitionModifier(viz: VisualizerColorInfo, filler: number): void {
    if (filler >= 0) {
        viz.transitionModifier = filler;
    } else {
        throw new ValueOutOfBoundsError(viz, 0, 1);
    }
}

export function updateCycleModifier(viz: VisualizerColorInfo, filler: number): void {
    if (viz.palette.scale.length - filler > 0) {
        viz.cycleModifier = filler;
    } else {
        throw new ValueOutOfBoundsError(viz, 0, colorPaletteSize);
    }
}

export function updateLoudness(viz: VisualizerColorInfo, loudness: number): void {
    if (loudness >= 0) {
        viz.loudnessSensibility = loudness;
    } else {
        throw new ValueOutOfBoundsError(viz, 0, 1); //TODO Set Bounds, normalize
    }
}

export function updateMaxBeatConf(viz: VisualizerColorInfo, confidence: number): void {
    if (confidence >= viz.minBeatConf && confidence <= 1) {
        viz.maxBeatConf = confidence;
    } else {
        throw new ValueOutOfBoundsError(viz, viz.minBeatConf, 1);
    }
}

export function updateMinBeatConf(viz: VisualizerColorInfo, confidence: number): void {
    if (confidence <= viz.maxBeatConf && confidence >= 0) {
        viz.minBeatConf = confidence;
    } else {
        throw new ValueOutOfBoundsError(viz, 0, viz.maxBeatConf);
    }
}

export function updateVisualizerState(viz: VisualizerColorInfo, state: VisualizerState): void {
    viz.state = state;
}

export function updateName(viz: VisualizerInfo, name: string): void {
    if (name != null) {
        viz.name = name;
    } else {
        throw new NullNameError(viz);
    }
}

export function updatePalette(viz: VisualizerColorInfo, palette: PaletteDAO): void {
    if (palette != null) {
        viz.palette.info = palette;
        viz.palette.scale = null;
        viz.palette.hexColors = null;
    } else {
        throw new NullPaletteError(viz);
    }
}

export function generateScale(viz: VisualizerColorInfo): void {
    if (viz.palette.info != null) {
        let genColorsParsed = viz.palette.info.genColors;
        viz.palette.scale = generateColorPalette(genColorsParsed, true);
    } else {
        throw new NoPaletteDefinedError(viz);
    }
}

export function generateHexColors(viz: VisualizerColorInfo): void {
    if (viz.palette.scale == null && viz.palette != null) {
        generateScale(viz);
    }
    if (viz.palette.scale != null) {
        viz.palette.hexColors = viz.palette.scale.colors(colorPaletteSize + viz.cycleModifier);
    } else {
        throw new NoPaletteDefinedError(viz);
    }
}