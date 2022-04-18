import { APIFetcherI, ApiResponse} from './api_controller';
import { pingDelay, trackProgressTickRate } from './config/config.json';
import State from './state';

export class TrackController {

    private pingLoop: ReturnType<typeof setTimeout> = null;
    private beatLoop: ReturnType<typeof setTimeout> = null;
    private trackProgressLoop: ReturnType<typeof setTimeout> = null;
    private verbose: boolean = false;
    
    constructor(private state: State, private api: APIFetcherI, verbose?: boolean) {
        this.state = state;
        this.api = api;
        this.verbose = verbose;
    }

    // -- Public methods -- //
    /**
     * Sets the currently playing song and track analysis in state
     */
    public setCurrentlyPlaying({ track, analysis }): void {
        this.state.visualizer.currentlyPlaying = track;
        this.state.visualizer.trackAnalysis = analysis;

        this.startVisualizer();

        if (this.verbose)
            console.log(
                `Now playing: ${
                    this.state.visualizer.currentlyPlaying.album.artists[0].name
                } – ${this.state.visualizer.currentlyPlaying.name}`
            );
    }

    /**
     * sets visualizer to active, syncs beats, and begins ping loop
     */
    public startVisualizer(): void {
        if (this.verbose)
            console.log("\nVisualizer started");
        this.state.visualizer.active = true;
        //TODO
        // this.syncBeats(state);
        // ping(state);
    }

    /**
     * sets visualizer to inactive, terminates beat loop, and turns off led strip
     */
    public stopVisualizer(): void {
        if (this.verbose)
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
    public syncTrackProgress(initialProgress, initialTimestamp): void {
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
    public setTrackProgress(initialProgress): void {
        this.state.visualizer.initialTrackProgress = initialProgress;
    }

    /**
     * Establishes ping loop to query current track progress 
     */
    public ping(): void {
        if (this.pingLoop == null) {
            this.pingLoop = setInterval(
                () => this.api.fetchCurrentlyPlaying(),
                pingDelay
            );
        }
    }

    // -- Private methods -- //
    private stopBeatLoop(): void {
        if (this.beatLoop !== null) {
            clearTimeout(this.beatLoop);
        }
    }

    private stopTrackProgressLoop(): void {
        if (this.trackProgressLoop !== undefined) {
            clearTimeout(this.trackProgressLoop);
        }
    }

    private startTrackProgressLoop(): void {
        this.calculateTrackProgress();
        // calculate and set track progress on a specified tick rate
        this.trackProgressLoop = setInterval(() => {
            this.calculateTrackProgress();
        }, trackProgressTickRate);
    }

    private stopPingLoop(): void {
        if (this.pingLoop !== null) {
            clearInterval(this.pingLoop);
            this.stopVisualizer();
            if (this.verbose)
                console.log("\n\t==========\n\tTERMINATED\n\t==========\n");
        }
    }

    private stageBeat(): void {
        //set the timeout id to a variable in state for convenient loop cancellation.
        this.beatLoop = setTimeout(
            () => this.state.funcs.fireBeat(),
            this.calculateTimeUntilNextBeat()
        );
    }

    private calculateTrackProgress(): void {
        this.state.visualizer.trackProgress =
            this.state.visualizer.initialTrackProgress +
            (Date.now() - this.state.visualizer.initialTimestamp);
    }

    private calculateTimeUntilNextBeat(): number {
        var activeBeatStart = this.state.visualizer.activeBeat.start;
        var activeBeatDuration = this.state.visualizer.activeBeat.duration;
        // console.log("Beat conf. " + state.visualizer.activeBeat.confidence)
    
        var trackProgress = this.state.visualizer.trackProgress;
        var timeUntilNextBeat =
            activeBeatDuration - (trackProgress - activeBeatStart);
        return timeUntilNextBeat;
    }

}

// Ok, // Next Ping
// VizOff, // Start Viz
// NoTrack, // Stop Viz
// NoPlayback, // Next Ping
// WrongPlayback, // SyncTrackProgress | track, analysis, progress, initialTimestamp
// DeSynced, // SyncTrackProgress | progress, initialTimestamp