import State from "./state";
// export function serialize(obj) {
//     let str = [];
//     for (let p in obj)
//     if (obj.hasOwnProperty(p)) {
//         str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
//     }
//     return str.join("&");
// }



export function normalizeIntervals (state: State, { track, analysis }) {
    if (state.visualizer.hasAnalysis) {
        const beats = analysis["beats"];
        const sections = analysis["sections"];
        /** Ensure first interval of each type starts at zero. */
        beats[0].duration = beats[0].start + beats[0].duration;
        beats[0].start = 0;

        /** Ensure last interval of each type ends at the very end of the track. */
        beats[beats.length - 1].duration =
            track.duration_ms / 1000 - beats[beats.length - 1].start;

        /** Convert every time value to milliseconds for our later convenience. */
        beats.forEach(interval => {
            interval.start = interval.start * 1000;
            interval.duration = interval.duration * 1000;
        });
        sections.forEach(interval => {
            interval.start = interval.start * 1000;
            interval.duration = interval.duration * 1000;
        });
    }
}