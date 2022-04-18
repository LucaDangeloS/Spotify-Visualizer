import SocketIO from 'socket.io';

export default class State {
    backendSocket: SocketIO.Server = null;
    visualizerSocket: SocketIO.Server = null;
    headers: Object = {};
    visualizer: VisualizerInfo = new VisualizerInfo();

    
    constructor() {}

    addSocket(socket: SocketIO.Server): boolean {
        this.visualizerSocket = socket;
        return true;
    }
}
class VisualizerInfo {
    sections = Array<Object>();
    
    activeSection: Object = {};
    activeSectionIndex: number = -1;
    lastSectionIndex: number = -1;

    beats = Array<Object>();

    activeBeat: any = {};
    activeBeatIndex: number = -1;
    lastBeatIndex: number = -1;

    currentlyPlaying: any = {};
    trackAnalysis: any = {};
    hasAnalysis: boolean;

    initialTimestamp: number = 0;
    initialTrackProgress: number = 0;
    trackProgress: number = 0;

    active: boolean = false;
}