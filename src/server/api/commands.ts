import State from "/models/state";
import { VisualizerSocketInfo } from "/models/visualizerInfo/visualizerInfo";
import Synchronizer from "/spotify/synchronizer";

export class WrongArgumentsError extends Error {
    constructor(message: string) {
        super(message);
    }
}
// Auxiliary functions
function checkNegative(value: number) {
    if (typeof value !== "number") {
        throw new WrongArgumentsError("Value is not a number");
    }
    if (value < 0) {
        throw new WrongArgumentsError("Negative value");
    }
}
function checkLowerThreshold(value: number, threshold: number) {
    if (typeof value !== "number") {
        throw new WrongArgumentsError("Value is not a number");
    }
    if (value < threshold) {
        throw new WrongArgumentsError("Value below threshold");
    }
}
function checkUpperThreshold(value: number, threshold: number) {
    if (typeof value !== "number") {
        throw new WrongArgumentsError("Value is not a number");
    }
    if (value > threshold) {
        throw new WrongArgumentsError("Value above threshold");
    }
}
function checkDoubleThreshold(value: number, lowerThreshold: number, upperThreshold: number) {
    if (typeof value !== "number") {
        throw new WrongArgumentsError("Value is not a number");
    }
    if (value < lowerThreshold || value > upperThreshold) {
        throw new WrongArgumentsError("Value above threshold");
    }
}
function checkPercentage(value: number) {
    checkDoubleThreshold(value, 0, 1);
}


// Server commands
export function StopServer(synchronizer: Synchronizer) {
    synchronizer.stop(false);
}
export function StartServer(synchronizer: Synchronizer) {
    synchronizer.start(false);
}
// Implement cycle option, where there are no transitions
// export function SetCycle(state: State, cycle: number) {
//     state.cycle = cycle;
// }
export function ToggleSync(state: State) {
    if (state.isSynced) {
        state.desyncVisualizers();
    } else {
        state.syncVisualizers();
    }
}
// Sync the visualizers colors and attributes so that they are all the same
// export function SyncVisualizers(state: State) {
// }

// Sync commands
export function SetSyncLoudnessSensibility(state: State, loudnessSensibility: number) {
    checkDoubleThreshold(loudnessSensibility, 0, 3);
    state.syncSharedData.loudnessSensibility = loudnessSensibility;
}
export function SetSyncBaseTransitionAngle(state: State, baseTransitionAngle: number) {
    checkDoubleThreshold(baseTransitionAngle, -360, 360);
    state.syncSharedData.baseShiftAlpha = baseTransitionAngle;
}
export function SetSyncMinBeatConfidence(state: State, minBeatConfidence: number) {
    checkDoubleThreshold(minBeatConfidence, 0, state.syncSharedData.maxBeatConf);
    state.syncSharedData.minBeatConf = minBeatConfidence;
}
export function SetSyncMaxBeatConfidence(state: State, maxBeatConfidence: number) {
    checkDoubleThreshold(maxBeatConfidence, state.syncSharedData.minBeatConf, 1);
    state.syncSharedData.maxBeatConf = maxBeatConfidence;
}

// Server commands
export function SetGlobalDelay(state: State, pingInterval: number) {
    checkNegative(pingInterval);
    state.globalDelay = pingInterval;
}
export function SetPingInterval(synchronizer: Synchronizer, pingInterval: number) {
    checkNegative(pingInterval);
    synchronizer.pingDelay = pingInterval;
}
export function SetSyncOffsetThreshold(synchronizer: Synchronizer, syncOffsetThreshold: number) {
    checkNegative(syncOffsetThreshold);
    synchronizer.syncOffsetThreshold = syncOffsetThreshold;
}
export function SetPaletteSize(state: State, paletteSize: number) {
    checkNegative(paletteSize);
    state.paletteSize = paletteSize;
    // TODO Pending recreate all palettes from visualizers
}
export function FlushVisualizersColors(state: State) {
    // Sends an empty color array to all visualizers
    state.clearVisualizersColors()
}

// Visualizer commands (TODO: pass in the visualizer id?)
// export function AddVisualizer(state: State, visualizerId: string) {
//     state.visualizers.push(visualizer);
// }

// What the fuck is a cycle?
export function SetCycleModifier(state: State, cycleModifier: number) {
    // synchronizer.setCycle(cycle);
}

export function SetTransitionModifier(state: State, transitionModifier: number) {
}

export function FlushVisualizer(state: State, visualizerId: string) {
    state.visualizers.find((v) => v.id === visualizerId)?.socket.emit(
        'beat', []
    )
}