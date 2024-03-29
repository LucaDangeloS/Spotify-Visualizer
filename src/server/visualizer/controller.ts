import { VisualizerInfo, VisualizerSocketInfo, VisualizerStateT } from "src/models/visualizerInfo/visualizerInfo";
import { generateColorPalette } from "src/models/palette/colors";
import { NoPaletteDefinedError, NullNameError, NullPaletteError, ValueOutOfBoundsError } from "./errors";
import { PaletteDAO } from "src/models/palette/paletteDAO";
import Synchronizer from "/spotify/synchronizer";

// TODO DEPRECATED

export function updateDelay(viz: VisualizerSocketInfo, delay: number): void {
    if (delay >= 0) {
        viz.delay = delay;
    } else {
        throw new ValueOutOfBoundsError(viz, 0, 1000);
    }
}

export function updateTransitionModifier(viz: VisualizerInfo, filler: number): void {
    if (filler >= 0) {
        viz.transitionModifier = filler;
    } else {
        throw new ValueOutOfBoundsError(viz, 0, 1);
    }
}

export function updateCycleModifier(viz: VisualizerInfo, filler: number): void {
    if (viz.palette.scale.length - filler > 0) {
        viz.cycleModifier = filler;
    } else {
        throw new ValueOutOfBoundsError(viz, 0, viz.palette.size);
    }
}

export function updateLoudness(viz: VisualizerInfo, loudness: number): void {
    if (loudness >= 0) {
        viz.loudnessSensibility = loudness;
    } else {
        throw new ValueOutOfBoundsError(viz, 0, 1); //TODO Set Bounds, normalize
    }
}

export function updateMaxBeatConf(viz: VisualizerInfo, confidence: number): void {
    if (confidence >= viz.minBeatConf && confidence <= 1) {
        viz.maxBeatConf = confidence;
    } else {
        throw new ValueOutOfBoundsError(viz, viz.minBeatConf, 1);
    }
}

export function updateMinBeatConf(viz: VisualizerInfo, confidence: number): void {
    if (confidence <= viz.maxBeatConf && confidence >= 0) {
        viz.minBeatConf = confidence;
    } else {
        throw new ValueOutOfBoundsError(viz, 0, viz.maxBeatConf);
    }
}

export function updateVisualizerState(viz: VisualizerInfo, state: VisualizerStateT): void {
    viz.state = state;
}

export function updateName(viz: VisualizerSocketInfo, name: string): void {
    if (name != null) {
        viz.name = name;
    } else {
        throw new NullNameError(viz);
    }
}

export function updatePalette(viz: VisualizerInfo, palette: PaletteDAO): void {
    if (palette != null) {
        viz.palette.info = palette;
        viz.palette.scale = null;
        viz.palette.hexColors = null;
        viz.palette.size = null;
    } else {
        throw new NullPaletteError(viz);
    }
}

// export function generateScale(viz: VisualizerInfo): void {
//     if (viz.palette.info != null) {
//         const genColorsParsed = viz.palette.info.genColors;
//         viz.palette.scale = generateColorPalette(genColorsParsed, true);
//     } else {
//         throw new NoPaletteDefinedError(viz);
//     }
// }

export function generateHexColors(viz: VisualizerInfo, doubleColors: boolean = false): void {
    if (viz.palette.scale == null && viz.palette != null && viz.palette.info != null) {
        // Generate scale if not already generated
        const genColorsParsed = viz.palette.info.genColors;
        viz.palette.scale = generateColorPalette(genColorsParsed, true, viz.brightness, doubleColors);
    } else {
        throw new NoPaletteDefinedError(viz);
    }
    if (viz.palette.scale != null) {
        viz.palette.hexColors = viz.palette.scale.colors(viz.palette.size + viz.cycleModifier);
        // viz.palette.hexColors.forEach(element => {
        //     // console.log(`"${element}",`);
        //     console.log(element);
        // });
    } else {
        throw new NoPaletteDefinedError(viz);
    }
}