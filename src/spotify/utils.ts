import State from "/models/state";
import { analysisI, beatI, sectionI, trackI } from "/models/spotifyApiInterfaces";

/**
 * Method borrowed from https://github.com/zachwinter/kaleidosync
 * Beat interval data is not present for entire duration of track data, and it is in seconds, not ms
 * We must make sure the first beat starts at 0, and the last ends at the end of the track
 * Then convert all time data to ms.
 */
export function normalizeIntervals (state: State, { track, analysis }: { track: trackI, analysis: analysisI }): void {
    if (state.trackInfo.hasAnalysis) {
        const beats = analysis["beats"];
        const sections = analysis["sections"];
        /** Ensure first interval of each type starts at zero. */
        beats[0].duration = beats[0].start + beats[0].duration;
        beats[0].start = 0;

        /** Ensure last interval of each type ends at the very end of the track. */
        beats[beats.length - 1].duration =
            track.duration_ms / 1000 - beats[beats.length - 1].start;

        /** Convert every time value to milliseconds for our later convenience. */
        beats.forEach((interval: beatI) => {
            interval.start = interval.start * 1000;
            interval.duration = interval.duration * 1000;
        });
        sections.forEach((interval: sectionI) => {
            interval.start = interval.start * 1000;
            interval.duration = interval.duration * 1000;
        });
    }
}

export function delay(time: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, time));
}

export function generateIdFromColors(colors: string[]): string {
    let ret: string = colors.join('');
    
    return ret;
}