import { APIFetcherI, ApiResponse} from './api_controller';
import { trackProgressTickRate, beatConfidence } from './config/config.json';
import State from './state';

export class TrackController {

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
    public setCurrentlyPlaying(track: Object, analysis: Object): void {
        this.state.visualizer.currentlyPlaying = track;
        this.state.visualizer.trackAnalysis = analysis;

        this.startVisualizer();

        if (this.verbose){
            console.log(
                `Now playing: ${
                    this.state.visualizer.currentlyPlaying.album.artists[0].name
                } – ${this.state.visualizer.currentlyPlaying.name}`
            );
        }
    }

    /**
     * sets visualizer to active, syncs beats, and begins ping loop
     */
    public startVisualizer(): void {
        if (this.verbose)
            console.log("\nVisualizer started");
        this.state.visualizer.active = true;
        //TODO
        this.syncBeats();
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

    private stageBeat(): void {
        //set the timeout id to a variable in state for convenient loop cancellation.
        this.beatLoop = setTimeout(
            () => this.fireBeat(),
            this.calculateTimeUntilNextBeat()
        );
    }

    // TODO Change for callback function
    private fireBeat(): void {
        console.log("BEAT");
        this.incrementBeat();
    }

    private incrementBeat() {
    
        let beats = this.state.visualizer.trackAnalysis["beats"];
        let sections = this.state.visualizer.trackAnalysis["sections"]
        let lastBeatIndex = this.state.visualizer.activeBeatIndex;
        let lastSectionIndex = this.state.visualizer.activeSectionIndex;
    
        if (this.state.visualizer.activeSectionIndex < sections.length - 1 &&
            this.state.visualizer.trackProgress >= sections[lastSectionIndex].start + sections[lastSectionIndex].duration) 
            {
                this.state.visualizer.activeSectionIndex += 1;
                this.state.visualizer.activeSection = sections[this.state.visualizer.activeSectionIndex]
        }
        // if the last beat index is the last beat of the song, stop beat loop
        if (beats.length - 1 !== lastBeatIndex) {
            // stage the beat
            this.stageBeat();
    
            
            // update the active beat to be the next beat
            this.state.visualizer.activeBeatIndex = lastBeatIndex + 1;
            this.state.visualizer.activeBeat = beats[this.state.visualizer.activeBeatIndex];
        }
    }

    private calculateTrackProgress(): void {
        this.state.visualizer.trackProgress =
            this.state.visualizer.initialTrackProgress +
            (Date.now() - this.state.visualizer.initialTimestamp);
    }

    private calculateTimeUntilNextBeat(): number {
        let activeBeatStart = this.state.visualizer.activeBeat.start;
        let activeBeatDuration = this.state.visualizer.activeBeat.duration;
        // console.log("Beat conf. " + state.visualizer.activeBeat.confidence)
    
        let trackProgress = this.state.visualizer.trackProgress;
        let timeUntilNextBeat =
            activeBeatDuration - (trackProgress - activeBeatStart);

        return timeUntilNextBeat;
    }

    /**
 * Manages the beat fire loop and detection of the active beat.
 */
    private syncBeats() {
        if (this.state.visualizer.hasAnalysis) {
            // reset the active beat
            this.state.visualizer.activeBeat = {};
            this.state.visualizer.activeSection = {};
            this.state.visualizer.activeBeatIndex = 0;
            this.state.visualizer.activeSectionIndex = 0;

            // grab this.state vars
            var trackProgress = this.state.visualizer.trackProgress;
            var beats = this.state.visualizer.trackAnalysis["beats"];
            var sections = this.state.visualizer.trackAnalysis["sections"]
            
            for (var i = 0; i < sections.length - 2; i++) {
                if (
                    trackProgress > sections[i].start &&
                    trackProgress < sections[i + 1].start
                ) {
                    this.state.visualizer.activeSection = sections[i];
                    this.state.visualizer.activeSectionIndex = i;
                }
            }

            // find and set the currently active beat
            for (var i = 0; i < beats.length - 2; i++) {
                if (
                    trackProgress > beats[i].start &&
                    trackProgress < beats[i + 1].start
                ) {
                    this.state.visualizer.activeBeat = beats[i];
                    this.state.visualizer.activeBeatIndex = i;
                    break;
                }
            }
            // stage the beat
            this.stageBeat();
        }
    }

}