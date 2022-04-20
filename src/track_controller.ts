import { trackProgressTickRate, beatConfidence } from './config/config.json';
import State from './state';
import { analysisI, trackI } from './types';

/*
* Many methods were borrowed and inspired 
* from https://github.com/lukefredrickson/spotify-led-visualizer
*/

export class TrackController {

    private beatLoop: ReturnType<typeof setTimeout> = null;
    private trackProgressLoop: ReturnType<typeof setTimeout> = null;
    private verbose: boolean = false;
    
    constructor(verbose?: boolean) {
        this.verbose = verbose;
    }

    // -- Public methods -- //
    /**
     * Sets the currently playing song and track analysis in state
     */
    public setCurrentlyPlaying(state: State, track: trackI, analysis: analysisI): void {
        state.visualizer.currentlyPlaying = track;
        state.visualizer.trackAnalysis = analysis;

        this.startVisualizer(state);
        
        if (this.verbose){
            console.log(
                `Now playing: ${
                    state.visualizer.currentlyPlaying.album.artists[0].name
                } – ${state.visualizer.currentlyPlaying.name}`
            );
        }
    }

    /**
     * sets visualizer to active, syncs beats, and begins ping loop
     */
    public startVisualizer(state: State): void {
        if (this.verbose) {
            console.log("\nVisualizer started");
        }
        state.visualizer.active = true;

        this.syncBeats(state);
    }

    /**
     * sets visualizer to inactive, terminates beat loop, and turns off led strip
     */
    public stopVisualizer(): void {
        if (this.verbose) {
            console.log("\nVisualizer stopped");
        }
        // stop the track progress loop if it's running
        this.stopTrackProgressLoop();
        // stop the beat loop if it's running
        this.stopBeatLoop();
        // TODO send a reset signal to visualizers_sockets
    }

    /**
     * resets any track progress approximation loop currently running and begins a new loop
     */
    public syncTrackProgress(state: State, initialProgress: number, initialTimestamp: number): void {
        state.visualizer.initialTimestamp = initialTimestamp;
        // stop the track progress update loop
        this.stopTrackProgressLoop();
        // set the new approximate track progress
        this.setTrackProgress(state, initialProgress);
        // begin the track progress update loop
        this.startTrackProgressLoop(state);
    }

    /**
     * sets the approximation of track progress
     */
    public setTrackProgress(state, initialProgress: number): void {
        state.visualizer.initialTrackProgress = initialProgress;
    }

    public stopBeatLoop(): void {
        if (this.beatLoop !== null) {
            clearTimeout(this.beatLoop);
        }
    }

    /**
     * Manages the beat fire loop and detection of the active beat.
     */
     public syncBeats(state: State) {
        if (state.visualizer.hasAnalysis) {
            // reset the active beat
            state.visualizer.activeBeat = null;
            state.visualizer.activeSection = null;
            state.visualizer.activeBeatIndex = 0;
            state.visualizer.activeSectionIndex = 0;

            // grab state vars
            var trackProgress = state.visualizer.trackProgress;
            var beats = state.visualizer.trackAnalysis["beats"];
            var sections = state.visualizer.trackAnalysis["sections"]
            
            for (var i = 0; i < sections.length - 2; i++) {
                if (
                    trackProgress > sections[i].start &&
                    trackProgress < sections[i + 1].start
                ) {
                    state.visualizer.activeSection = sections[i];
                    state.visualizer.activeSectionIndex = i;
                }
            }

            // find and set the currently active beat
            for (var i = 0; i < beats.length - 2; i++) {
                if (
                    trackProgress > beats[i].start &&
                    trackProgress < beats[i + 1].start
                ) {
                    state.visualizer.activeBeat = beats[i];
                    state.visualizer.activeBeatIndex = i;
                    break;
                }
            }
            // stage the beat
            this.stageBeat(state);
        }
    }

    // -- Private methods -- //
    private stopTrackProgressLoop(): void {
        if (this.trackProgressLoop !== undefined) {
            clearTimeout(this.trackProgressLoop);
        }
    }

    private startTrackProgressLoop(state: State): void {
        this.calculateTrackProgress(state);
        // calculate and set track progress on a specified tick rate
        this.trackProgressLoop = setInterval(() => {
            this.calculateTrackProgress(state);
        }, trackProgressTickRate);
    }

    private stageBeat(state: State): void {
        //set the timeout id to a variable in state for convenient loop cancellation.
        this.beatLoop = setTimeout(
            () => this.fireBeat(state),
            this.calculateTimeUntilNextBeat(state)
        );
    }

    // TODO Change for callback function
    private fireBeat(state: State): void {
        if (state.visualizer.activeBeat.confidence >= beatConfidence)
            console.log("BEAT - " + state.visualizer.activeBeat.confidence);
        this.incrementBeat(state);
    }

    private incrementBeat(state: State) {
    
        let beats = state.visualizer.trackAnalysis["beats"];
        let sections = state.visualizer.trackAnalysis["sections"]
        let lastBeatIndex = state.visualizer.activeBeatIndex;
        let lastSectionIndex = state.visualizer.activeSectionIndex;
    
        if (state.visualizer.activeSectionIndex < sections.length - 1 &&
            state.visualizer.trackProgress >= sections[lastSectionIndex].start + sections[lastSectionIndex].duration) 
            {
                state.visualizer.activeSectionIndex += 1;
                state.visualizer.activeSection = sections[state.visualizer.activeSectionIndex]
        }
        // if the last beat index is the last beat of the song, stop beat loop
        if (beats.length - 1 !== lastBeatIndex) {
            // stage the beat
            this.stageBeat(state);
    
            
            // update the active beat to be the next beat
            state.visualizer.activeBeatIndex = lastBeatIndex + 1;
            state.visualizer.activeBeat = beats[state.visualizer.activeBeatIndex];
        }
    }

    private calculateTrackProgress(state: State): void {
        state.visualizer.trackProgress =
            state.visualizer.initialTrackProgress +
            (Date.now() - state.visualizer.initialTimestamp);
    }

    private calculateTimeUntilNextBeat(state: State): number {
        let activeBeatStart = state.visualizer.activeBeat.start;
        let activeBeatDuration = state.visualizer.activeBeat.duration;
        // console.log("Beat conf. " + state.visualizer.activeBeat.confidence)
    
        let trackProgress = state.visualizer.trackProgress;
        let timeUntilNextBeat =
            activeBeatDuration - (trackProgress - activeBeatStart);

        return timeUntilNextBeat;
    }

}
