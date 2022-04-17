import { APIFetcherI, ApiResponse} from './api_controller';
import State from './State';

export class TrackController {

    constructor(private state: State, private api: APIFetcherI) {
        this.state = state;
        this.api = api;
    }

    /**
     * Sets the currently playing song and track analysis in state
     */
    public setCurrentlyPlaying({ track, analysis }) {
        this.state.visualizer.currentlyPlaying = track;
        this.state.visualizer.trackAnalysis = analysis;

        this.startVisualizer();

        console.log(
            `Now playing: ${
                this.state.visualizer.currentlyPlaying.album.artists[0].name
            } – ${this.state.visualizer.currentlyPlaying.name}`
        );
    }

    /**
     * sets visualizer to active, syncs beats, and begins ping loop
     */
     public startVisualizer() {
        console.log("\nVisualizer started");
        this.state.visualizer.active = true;
        //TODO
        // this.syncBeats(state);
        // ping(state);
    }

    /**
     * sets visualizer to inactive, terminates beat loop, and turns off led strip
     */
     public stopVisualizer() {
        console.log("\nVisualizer stopped");
        this.state.visualizer.active = false;
        // stop the track progress loop if it's running
        this.stopTrackProgressLoop();
        // stop the beat loop if it's running
        this.stopBeatLoop();
        // TODO send a reset signal to visualizers_sockets
    }

    /**
     * resets any track progress approximation loop currently running and begins a new loop
     */
     public syncTrackProgress(initialProgress, initialTimestamp) {
        this.state.visualizer.initialTimestamp = initialTimestamp;
        // stop the track progress update loop
        this.stopTrackProgressLoop();
        // set the new approximate track progress
        this.setTrackProgress(initialProgress);
        // begin the track progress update loop
        this.startTrackProgressLoop();
    }

    /**
     * sets the approximation of track progress
     */
    public setTrackProgress(initialProgress) {
        this.state.visualizer.initialTrackProgress = initialProgress;
    }

    stopBeatLoop() {
        throw new Error('Method not implemented.');
    }

    stopTrackProgressLoop() {
        throw new Error('Method not implemented.');
    }

    startTrackProgressLoop() {
        throw new Error('Method not implemented.');
    }
}

// Ok, // Next Ping
// VizOff, // Start Viz
// NoTrack, // Stop Viz
// NoPlayback, // Next Ping
// WrongPlayback, // SyncTrackProgress | track, analysis, progress, initialTimestamp
// DeSynced, // SyncTrackProgress | progress, initialTimestamp