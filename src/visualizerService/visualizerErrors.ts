import { VisualizerInfo, VisualizerSocketInfo } from "src/models/visualizerInfo/visualizerInfo";

export class NoPaletteDefinedError extends Error {
    VisualizerColorInfo: VisualizerInfo;

    constructor(VisualizerColorInfo: VisualizerInfo) {
        VisualizerColorInfo = VisualizerColorInfo;
        super("No palette defined");
    }

    getVisualizerColorInfo(): VisualizerInfo {
        return this.VisualizerColorInfo;
    }
}

export class NullNameError extends Error {
    VisualizerInfo: VisualizerSocketInfo;

    constructor(VisualizerColorInfo: VisualizerSocketInfo) {
        VisualizerColorInfo = VisualizerColorInfo;
        super("Name cannot be empty");
    }

    getVisualizerColorInfo(): VisualizerSocketInfo {
        return this.VisualizerInfo;
    }
}

export class NullPaletteError extends Error {
    VisualizerColorInfo: VisualizerInfo;

    constructor(VisualizerColorInfo: VisualizerInfo) {
        VisualizerColorInfo = VisualizerColorInfo;
        super("Palette cannot be empty");
    }

    getVisualizerColorInfo(): VisualizerInfo {
        return this.VisualizerColorInfo;
    }
}

export class ValueOutOfBoundsError extends Error {
    VisualizerColorInfo: VisualizerInfo;
    minBound: number;
    maxBound: number;

    constructor(VisualizerInfo: VisualizerSocketInfo|VisualizerInfo, minBound: number, maxBound: number) {
        VisualizerInfo = VisualizerInfo;
        minBound = minBound;
        maxBound = maxBound;
        super(`Value out of bounds, must be between ${minBound} and ${maxBound}`);
    }

    getVisualizerColorInfo(): VisualizerInfo {
        return this.VisualizerColorInfo;
    }

    getMinBound(): number {
        return this.minBound;
    }

    getMaxBound(): number {
        return this.maxBound;
    }
} 