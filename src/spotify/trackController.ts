import { trackProgressTickRate } from "../config/config.json";
import State from "../models/state";
import { analysisI, trackI } from "../models/spotifyApiInterfaces";
import { pingDelay } from "../config/config.json";

/*
 * Many methods were borrowed and inspired
 * from https://github.com/lukefredrickson/spotify-led-visualizer
 */

// -- Public functions -- //
/**
 * Sets the currently playing song and track analysis in state
 */
export function setCurrentlyPlaying(
    state: State,
    track: trackI,
    analysis: analysisI
): void {
    state.trackInfo.currentlyPlaying = track;
    state.trackInfo.beats = analysis.beats;
    state.trackInfo.sections = analysis.sections;
    state.trackInfo.meanLoudness = analysis.track.loudness;
    state.trackInfo.meanTempo = analysis.track.tempo;

    startVisualizer(state);

    if (state.verbose) {
        console.log(
            `Now playing: ${state.trackInfo.currentlyPlaying.album.artists[0].name} – ${state.trackInfo.currentlyPlaying.name}`
        );
    }
}

/**
 * sets visualizer to active, syncs beats, and begins ping loop
 */
export function startVisualizer(state: State): void {
    if (state.verbose) {
        console.log("\nVisualizer started");
    }
    state.trackInfo.active = true;

    syncBeats(state);
}

/**
 * sets visualizer to inactive, terminates beat loop, and turns off led strip
 */
export function stopVisualizer(state: State): void {
    if (!state.trackInfo.active) {
        return;
    }
    if (state.verbose) {
        console.log("\nVisualizer stopped");
    }
    state.trackInfo.active = false;
    // stop the track progress loop if it's running
    stopTrackProgressLoop(state);
    // stop the beat loop if it's running
    stopBeatLoop(state);
}

/**
 * resets any track progress approximation loop currently running and begins a new loop
 */
export function syncTrackProgress(
    state: State,
    initialProgress: number,
    initialTimestamp: number
): void {
    state.trackInfo.initialTimestamp = initialTimestamp;
    // stop the track progress update loop
    stopTrackProgressLoop(state);
    // set the new approximate track progress
    setTrackProgress(state, initialProgress);
    // begin the track progress update loop
    startTrackProgressLoop(state);
}

/**
 * sets the approximation of track progress
 */
export function setTrackProgress(state: State, initialProgress: number): void {
    state.trackInfo.initialTrackProgress = initialProgress;
}

export function stopBeatLoop(state: State): void {
    if (state.loops.beatLoop !== null) {
        clearTimeout(state.loops.beatLoop);
    }
}

/**
 * Manages the beat fire loop and detection of the active beat.
 */
export function syncBeats(state: State) {
    if (state.trackInfo.hasAnalysis) {
        // reset the active beat
        state.trackInfo.activeBeat = null;
        state.trackInfo.activeSection = null;
        state.trackInfo.activeBeatIndex = 0;
        state.trackInfo.activeSectionIndex = 0;

        // grab state vars
        let trackProgress = state.trackInfo.trackProgress;
        let beats = state.trackInfo.beats;
        let sections = state.trackInfo.sections;

        for (var i = 0; i < sections.length - 2; i++) {
            if (
                trackProgress > sections[i].start &&
                trackProgress < sections[i + 1].start
            ) {
                state.trackInfo.activeSection = sections[i];
                state.trackInfo.activeSectionIndex = i;
            }
        }

        // find and set the currently active beat
        for (var i = 0; i < beats.length - 2; i++) {
            if (
                trackProgress > beats[i].start &&
                trackProgress < beats[i + 1].start
            ) {
                state.trackInfo.activeBeat = beats[i];
                state.trackInfo.activeBeatIndex = i;
                break;
            }
        }
        // stage the beat
        stageBeat(state);
    }
}

// -- Private functions -- //
function stopTrackProgressLoop(state: State): void {
    if (state.loops.trackProgressLoop !== undefined) {
        clearTimeout(state.loops.trackProgressLoop);
    }
}

function startTrackProgressLoop(state: State): void {
    stopTrackProgressLoop(state);
    calculateTrackProgress(state);
    // calculate and set track progress on a specified tick rate
    state.loops.trackProgressLoop = setInterval(() => {
        calculateTrackProgress(state);
    }, trackProgressTickRate);
}

function stageBeat(state: State): void {
    //set the timeout id to a variable in state for convenient loop cancellation.
    let timeForNextBeat = calculateTimeUntilNextBeat(state)
    let baseDelay = (timeForNextBeat + state.globalDelay);
    let delay = baseDelay > 0 ? baseDelay : 0;
    state.loops.beatLoop = setTimeout(() => {
        state.beatCallback(state);
        incrementBeat(state);
    }, delay);
}

function incrementBeat(state: State) {
    let beats = state.trackInfo.beats;
    let sections = state.trackInfo.sections;
    let lastBeatIndex = state.trackInfo.activeBeatIndex;
    let lastSectionIndex = state.trackInfo.activeSectionIndex;

    if (
        state.trackInfo.activeSectionIndex < sections.length - 1 &&
        state.trackInfo.trackProgress >=
            sections[lastSectionIndex].start +
                sections[lastSectionIndex].duration
    ) {
        state.trackInfo.activeSectionIndex += 1;
        state.trackInfo.activeSection =
            sections[state.trackInfo.activeSectionIndex];
    }
    // if the last beat index is the last beat of the song, stop beat loop
    if (lastBeatIndex === beats.length - 1) {
        stopBeatLoop(state);
    } else {
        // stage the beat
        stageBeat(state);

        // update the active beat to be the next beat
        state.trackInfo.activeBeatIndex = lastBeatIndex + 1;
        state.trackInfo.activeBeat = beats[state.trackInfo.activeBeatIndex];
    }
}

function calculateTrackProgress(state: State): void {
    state.trackInfo.trackProgress =
        state.trackInfo.initialTrackProgress +
        (Date.now() - state.trackInfo.initialTimestamp);
}

function calculateTimeUntilNextBeat(state: State): number {
    if (state.trackInfo.activeBeat === null) return pingDelay / 2;
    let activeBeatStart = state.trackInfo.activeBeat.start;
    let activeBeatDuration = state.trackInfo.activeBeat.duration;
    // console.log("Beat conf. " + state.trackInfo.activeBeat.confidence)

    let trackProgress = state.trackInfo.trackProgress;
    let timeUntilNextBeat =
        activeBeatDuration - (trackProgress - activeBeatStart);
    // Round numbers to 2 decimal places
    console.log(`${activeBeatDuration.toFixed(2)} - (${trackProgress.toFixed(2)} - ${activeBeatStart.toFixed(2)}) = ${timeUntilNextBeat.toFixed(2)} ms`)
    return timeUntilNextBeat;
}
