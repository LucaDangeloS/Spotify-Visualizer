import SocketIO from 'socket.io';
import { refreshTokenResponseI  } from './io/apiController';

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

export default class State {
    trackInfo: TrackInfo = new TrackInfo();
    colorInfo: ColorInfo = new ColorInfo();
    loops: Loops = new Loops();
    beatCallback: Function;
    verbose : boolean;
    active : boolean;
    headers = {};

    private _accessToken: string = null;
    private _expireTimestamp: Date = null;

    public setAccessToken(accessToken: refreshTokenResponseI) {
        this._accessToken = accessToken.access_token;
        this._expireTimestamp = new Date(Date.now() + accessToken.expires_in * 1000);
        this.headers = { Authorization: "Bearer " + this._accessToken };
        if (this.verbose) {
            console.log("access token set " + this._accessToken);
            console.log("expire timestamp set " + this._expireTimestamp);
        }
    }
    public get accessToken(): string {
        return this._accessToken;
    }

    public get expireTimestamp(): Date {
        return this._expireTimestamp;
    }

    constructor(beatCallback: Function = () => {}, verbose: boolean = false) {
        this.verbose = verbose;
        this.active = true;
        this.beatCallback = beatCallback;
    }

}

class TrackInfo {
    sections = Array<sectionI>();
    
    activeSection: sectionI;
    activeSectionIndex: number = -1;
    lastSectionIndex: number = -1;

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

class Loops {
    beatLoop: ReturnType<typeof setTimeout> = null;
    trackProgressLoop: ReturnType<typeof setTimeout> = null;
}

class ColorInfo {
    activePalette: string[];
    availablePalettes: string[][];
}