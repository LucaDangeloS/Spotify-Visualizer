import { VisualizerColorInfo, VisualizerInfo } from "src/models/visualizerInfo/visualizerInfo";

export class NoPaletteDefinedError extends Error {
    VisualizerColorInfo: VisualizerColorInfo;

    constructor(VisualizerColorInfo: VisualizerColorInfo) {
        VisualizerColorInfo = VisualizerColorInfo;
        super("No palette defined");
    }

    getVisualizerColorInfo(): VisualizerColorInfo {
        return this.VisualizerColorInfo;
    }
}

export class NullNameError extends Error {
    VisualizerInfo: VisualizerInfo;

    constructor(VisualizerColorInfo: VisualizerInfo) {
        VisualizerColorInfo = VisualizerColorInfo;
        super("Name cannot be empty");
    }

    getVisualizerColorInfo(): VisualizerInfo {
        return this.VisualizerInfo;
    }
}

export class NullPaletteError extends Error {
    VisualizerColorInfo: VisualizerColorInfo;

    constructor(VisualizerColorInfo: VisualizerColorInfo) {
        VisualizerColorInfo = VisualizerColorInfo;
        super("Palette cannot be empty");
    }

    getVisualizerColorInfo(): VisualizerColorInfo {
        return this.VisualizerColorInfo;
    }
}

export class ValueOutOfBoundsError extends Error {
    VisualizerColorInfo: VisualizerColorInfo;
    minBound: number;
    maxBound: number;

    constructor(VisualizerInfo: VisualizerInfo|VisualizerColorInfo, minBound: number, maxBound: number) {
        VisualizerInfo = VisualizerInfo;
        minBound = minBound;
        maxBound = maxBound;
        super("Value out of bounds");
    }

    getVisualizerColorInfo(): VisualizerColorInfo {
        return this.VisualizerColorInfo;
    }

    getMinBound(): number {
        return this.minBound;
    }

    getMaxBound(): number {
        return this.maxBound;
    }
} 