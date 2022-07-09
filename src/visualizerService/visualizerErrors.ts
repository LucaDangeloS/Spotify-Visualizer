import { VisualizerInfo } from "src/models/visualizerInfo/visualizerInfo";

export class NoPaletteDefinedError extends Error {
    visualizerInfo: VisualizerInfo;

    constructor(visualizerInfo: VisualizerInfo) {
        visualizerInfo = visualizerInfo;
        super("No palette defined");
    }

    getVisualizerInfo(): VisualizerInfo {
        return this.visualizerInfo;
    }
}

export class NullNameError extends Error {
    visualizerInfo: VisualizerInfo;

    constructor(visualizerInfo: VisualizerInfo) {
        visualizerInfo = visualizerInfo;
        super("Name cannot be empty");
    }

    getVisualizerInfo(): VisualizerInfo {
        return this.visualizerInfo;
    }
}

export class NullPaletteError extends Error {
    visualizerInfo: VisualizerInfo;

    constructor(visualizerInfo: VisualizerInfo) {
        visualizerInfo = visualizerInfo;
        super("Palette cannot be empty");
    }

    getVisualizerInfo(): VisualizerInfo {
        return this.visualizerInfo;
    }
}

export class ValueOutOfBoundsError extends Error {
    visualizerInfo: VisualizerInfo;
    minBound: number;
    maxBound: number;

    constructor(visualizerInfo: VisualizerInfo, minBound: number, maxBound: number) {
        visualizerInfo = visualizerInfo;
        minBound = minBound;
        maxBound = maxBound;
        super("Value out of bounds");
    }

    getVisualizerInfo(): VisualizerInfo {
        return this.visualizerInfo;
    }

    getMinBound(): number {
        return this.minBound;
    }

    getMaxBound(): number {
        return this.maxBound;
    }
} 