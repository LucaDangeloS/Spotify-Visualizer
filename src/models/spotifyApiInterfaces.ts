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
    duration: number,
}

export interface analysisI {
    beats: Array<beatI>,
    sections: Array<sectionI>
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
    maxDb: number = 0;
    minDb: number = 0;

    beats = Array<beatI>(0);

    activeBeat: beatI;
    activeBeatIndex: number = -1;
    lastBeatIndex: number = -1;

    currentlyPlaying: trackI;
    trackAnalysis: analysisI;
    hasAnalysis: boolean = true;

    initialTimestamp: number = 0;
    initialTrackProgress: number = 0;
    trackProgress: number = 0;

    active = false;
}