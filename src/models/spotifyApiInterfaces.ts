export interface trackI {
    id: string,
    name: string,
    duration_ms: number,
    album: {
        artists: {
            name: string
        }
    }
}

export interface beatI {
    confidence: number,
    start: number, 
    duration: number
}

export interface sectionI {
    start: number,
    loudness: number,
    tempo : number,
    duration: number,
}

export interface analysisI {
    beats: Array<beatI>,
    sections: Array<sectionI>,
    track: globalTrackI
}

export interface globalTrackI {
    loudness: number,
    tempo: number
}

export interface trackInfoI {
    progress: number,
    initialTimestamp: number,
    track: trackI,
    analysis: analysisI
}

export interface progressInfoI {
    progress: number,
    initialTimestamp: number,
}

export class TrackInfo {
    sections = Array<sectionI>();
    
    activeSection: sectionI;
    activeSectionIndex: number = -1;
    lastSectionIndex: number = -1;
    meanLoudness = 0;
    meanTempo = 0;

    beats = Array<beatI>(0);

    activeBeat: beatI;
    activeBeatIndex: number = -1;
    lastBeatIndex: number = -1;

    currentlyPlaying: trackI;
    hasAnalysis: boolean = true;

    initialTimestamp: number = 0;
    initialTrackProgress: number = 0;
    trackProgress: number = 0;

    active = false;
}