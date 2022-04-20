import SocketIO from 'socket.io';
import { analysisI, beatI, refreshTokenResponseI, sectionI, trackI } from './types';

export default class State {
    trackInfo: TrackInfo = new TrackInfo();
    loops: Loops = new Loops();
    beatCallback: Function;
    verbose : boolean;
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

    constructor(verbose: boolean = false, beatCallback: Function = () => {}) {
        this.verbose = verbose;
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
    hasAnalysis: boolean;

    initialTimestamp: number = 0;
    initialTrackProgress: number = 0;
    trackProgress: number = 0;

    active = false;
}

class Loops {
    beatLoop: ReturnType<typeof setTimeout> = null;
    trackProgressLoop: ReturnType<typeof setTimeout> = null;
}