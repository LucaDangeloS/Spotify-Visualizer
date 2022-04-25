import SocketIO from "socket.io";
import { refreshTokenResponseI } from "./api_controller";
/**
 * A track structure interface
 *
 * @property {string} id — Song id
 * @property {string} name — Song name
 * @property {number} duration_ms — Song duration {ms}
 * @property {string} album.artists.name — Artist's name
 */
export interface trackI {
    id: string;
    name: string;
    duration_ms: number;
    album: {
        artists: {
            name: string;
        };
    };
}
/**
 * A beat structure interface
 *
 * @property {number} confidence — @todo "explain"
 * @property {number} start — Beat's start timestamp {ms}
 * @property {number} duration — Duration of the beats in {ms}
 */
export interface beatI {
    confidence: number;
    start: number;
    duration: number;
}
/**
 * A section structure interface
 * @property {number} start — Section's start timestamp {ms}
 * @property {number} duration — Section's duration {ms}
 */
export interface sectionI {
    start: number;
    duration: number;
}
/**
 * An analysis structure interface
 * @property {Array<{beatI}>} beats — An array of beats for a song
 * @property {Array<{sectionI}>} sections — An array of sections for a song
 */
export interface analysisI {
    beats: Array<beatI>;
    sections: Array<sectionI>;
}
/**
 * A track information structure interface
 * @property {number} progress — Progress percentage of the track @todo
 * @property {number} initialTimestamp — @todo explain this
 * @property {trackI} track — The track the information refers to
 * @property {analysisI} analysis — The analysis of the song
 */
export interface trackInfoI {
    progress: number;
    initialTimestamp: number;
    track: trackI;
    analysis: analysisI;
}
/**
 * A progress information structure interface
 * @property {number} progress — Progress percentage of a track @todo
 * @property {number} initialTimestamp — @todo explain this
 */
export interface progressInfoI {
    progress: number;
    initialTimestamp: number;
}
/**
 * Class-based application state.
 * @property {TrackInfo} trackInfo — Progress percentage of a track @todo
 * @property {Loops} loops — @todo explain this
 * @property {Function} beatCallback — @todo explain this
 * @property {boolean} verbose — Boolean that controls verbose output of the app for debugging purposes
 * @property {Object} headers — @todo explain this
 * @property {string} _accessToken — Spotify's access token
 * @property {Date} _expireTimestamp — Expire timestamp of the access token
 */
export default class State {
    trackInfo: TrackInfo = new TrackInfo();
    loops: Loops = new Loops();
    beatCallback: Function;
    verbose: boolean;
    headers = {};

    private _accessToken: string = null;
    private _expireTimestamp: Date = null;
    /**
     *  Setter for the access token which sets _expireTimestamp and headers as a side effect
     * @param accessToken  AccessToken to set for Spotify
     */
    public setAccessToken(accessToken: refreshTokenResponseI): void {
        this._accessToken = accessToken.access_token;
        this._expireTimestamp = new Date(
            Date.now() + accessToken.expires_in * 1000
        );
        this.headers = { Authorization: "Bearer " + this._accessToken };
        if (this.verbose) {
            console.log("access token set " + this._accessToken);
            console.log("expire timestamp set " + this._expireTimestamp);
        }
    }
    /** accessToken getter
     * @return {string} _accessToken
     */
    public get accessToken(): string {
        return this._accessToken;
    }
    /** expireTimestamp getter
     * @return {Date} _expireTimestamp
     */
    public get expireTimestamp(): Date {
        return this._expireTimestamp;
    }

    constructor(beatCallback: Function = () => {}, verbose: boolean = false) {
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
