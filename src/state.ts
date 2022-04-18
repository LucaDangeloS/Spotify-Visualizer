import SocketIO from 'socket.io';

export default class State {
    backendSocket: SocketIO.Server = null;
    visualizerSocket: SocketIO.Server = null;
    headers: Object = {};
    visualizer: VisualizerInfo;

    
    constructor() {
        this.visualizer = new VisualizerInfo();
    }

    addSocket(socket: SocketIO.Server): boolean {
        this.visualizerSocket = socket;
        return true;
    }
}

class Funcs {
    fireBeat: Function;
    incrementBeat: Function;
    stopVisualizer: Function;
    syncTrackProgress: Function;
    setCurrentlyPlaying: Function;

    constructor(fireBeat: Function, incrementBeat: Function, stopVisualizer: Function, syncTrackProgress: Function, setCurrentlyPlaying: Function) {
        this.fireBeat = fireBeat;
        this.incrementBeat = incrementBeat;
        this.stopVisualizer = stopVisualizer;
        this.syncTrackProgress = syncTrackProgress;
        this.setCurrentlyPlaying = setCurrentlyPlaying;
    }
}

class VisualizerInfo {
    sections = Array<Object>();
    
    activeSection: Object = {};
    activeSectionIndex: number = -1;
    lastSectionIndex: number = -1;

    beats = Array<Object>();

    activeBeat: any = {};
    activeBeatIndex: number;
    lastBeatIndex: number;

    currentlyPlaying: any = {};
    trackAnalysis: any = {};
    hasAnalysis: boolean;

    initialTimestamp: number;
    initialTrackProgress: number;
    trackProgress: number;

    active: boolean = false;
}