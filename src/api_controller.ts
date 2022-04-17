import { token_url, auth_url, trackAnalysis_url, currentlyPlaying_url } from "./config/network-info.json";
import { syncOffsetThreshold } from "./config/config.json";
import { readFileSync } from "fs";
import State from "./state";
import axios from "axios";
// import { serialize } from "./utils";
import querystring = require("query-string");


export enum ApiResponse {
    Ok, // Next Ping
    VizOff, // Start Viz
    NoTrack, // Stop Viz
    NoPlayback, // Next Ping
    WrongPlayback, // SyncTrackProgress | track, analysis, progress, initialTimestamp
    DeSynced, // SyncTrackProgress | progress, initialTimestamp
};
export interface APIFetcherI {
    set accessToken(token: { access_token: string; expires_in: number; });
    refreshToken(): void;
}

// Spotify API Fetcher
export class APIFetcher implements APIFetcherI {
    private _accessToken: string;
    private _expireTimestamp: Date;
    private verbose: boolean = false;
    
    constructor(private client_id: string, private client_secret: string, private state: State, verbose?: boolean) {
        this.verbose = verbose;
        this.client_id = client_id;
        this.client_secret = client_secret;
        this.state = state;
        this.testToken();
    }

    private async testToken() {
        try {
            await this.refreshToken();
        } catch (err) {
            console.error("ERROR: " + err);
        }
    }

    // Setters
    public set accessToken(res: { access_token: string; expires_in: number; }) {
        this._accessToken = res.access_token;
        this._expireTimestamp = new Date(Date.now() + res.expires_in * 1000);
        this.state.headers = { Authorization: "Bearer " + res.access_token };
        // TODO Not needed
        // this.state.accessToken = res.access_token;
        if (this.verbose) {
            console.log("access token set " + this._accessToken);
            console.log("expire timestamp set " + this._expireTimestamp);
        }
    }

    // Public methods
    public async refreshToken() {
        let refresh_token = readFileSync('./token.txt', 'utf-8');
        let refresh_url = token_url;
        let refresh_body = {
            grant_type: "refresh_token",
            refresh_token: refresh_token,
        };
        let headers = {
            headers: {
                Authorization: `Basic ${Buffer.from(this.client_id + ":" + this.client_secret).toString('base64')}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };
        axios.post(refresh_url, querystring.stringify(refresh_body), headers)
            .then(res => {
                console.log("CALLED 2")
                this.accessToken = res.data;
            })
            .catch(err => {
                console.error(err);
                // throw new Error(err);
            })
    }
    
    /**
     * gets the currently playing song + track progress from spotify API
     */
     public fetchCurrentlyPlaying() {
        // grab the current time
        var timestamp = Date.now();
        console.log(this.state.headers);
        let headers: any = {
            headers: this.state.headers,
            json: true
        };
        // request the currently playing song from spotify API
        axios.get(currentlyPlaying_url, headers)
            .then(async (response) => {
                // access token is expired, we must request a new one
                if (response.status === 401) {
                    await this.refreshToken();
                    this.fetchCurrentlyPlaying();
                }
                // no device is playing music
                else if (response.status === 204) {
                    if (this.verbose)
                        console.log("\nNo playback detected");
                    // if (this.state.visualizer.active) {
                    //     // TODO 
                    //     // this.state.funcs.stopVisualizer(this.state);
                    //     return {status: ApiResponse.NoPlayback};
                    // }
                    // keep listening in case playback resumes
                    // ping(state);
                    return {status: ApiResponse.NoPlayback};
                }
                // no error, proceed
                else {
                    if (this.verbose)
                        console.log("\nDetected playing: " + response.data.item.name);
                    // process the response
                    this.processResponse({
                        track: response.data.item,
                        playing: response.data.is_playing,
                        // account for time to call api in progress
                        progress: response.data.progress_ms + (Date.now() - timestamp)
                    });
                }
            }
        );
    };


    // Private methods
    /**
     * figure out what to do, according to state and track data
     */
     private processResponse({ track, playing, progress }) {
        let songsInSync =
            JSON.stringify(this.state.visualizer.currentlyPlaying) ===
            JSON.stringify(track);

        let progressStats = {
            client: this.state.visualizer.trackProgress,
            server: progress,
            error: this.state.visualizer.trackProgress - progress
        };

        if (this.verbose) {
            console.log(`\nclient progress: ${progressStats.client}ms`);
            console.log(`server progress: ${progressStats.server}ms`);
            console.log(`Sync error: ${Math.round(progressStats.error)}ms\n`);
        }

        if (track === null || track === undefined) {
            // TODO Ping method
            // return ping(this.state);
            return {status: ApiResponse.Ok}
        }
    
        // if something is playing, but visualizer isn't on
        if (playing && !this.state.visualizer.active) {
            // start the visualizer if the songs are synced
            if (songsInSync) {
                // TODO Start Visualizer
                // return startVisualizer(state);
                return {status: ApiResponse.VizOff};
            }
            // otherwise, get the data for the new track
            return this.fetchTrackData({ track, progress });
        }
    
        // if nothing is playing but the visualizer is active
        if (!playing && this.state.visualizer.active) {
            // TODO Stop Visualizer
            // stopVisualizer(state);
            return {status: ApiResponse.NoTrack};
        }
    
        // if the wrong song is playing
        if (playing && this.state.visualizer.active && !songsInSync) {
            // get the data for the new track
            // TODO
            // stopVisualizer(state);
            return this.fetchTrackData({ track, progress });
        }
    
        // if the approximate track progress and the api track progress fall out of sync by more than 250ms
        // resync the progress and the beat loop
        if (
            playing &&
            this.state.visualizer.active &&
            songsInSync &&
            Math.abs(progressStats.error) > syncOffsetThreshold
        ) {
            var initialTimestamp = Date.now();
            // TODO Stop Beat loop
            // stopBeatLoop(state);
            // this.state.funcs.syncTrackProgress(this.state, progress, initialTimestamp);
            // TODO Sync beats
            // syncBeats(state);
            return {status: ApiResponse.DeSynced, 
                data: {progress: progress, initialTimestamp: initialTimestamp}};
        }
    
        // keep the ping loop going
        // ping(state);
    }


    /**
     * gets the song analysis (beat intervals, etc) for the current song from the spotify API
     */
    private fetchTrackData({ track, progress }) {
        // fetch the current time
        let timestamp = Date.now();
        let headers: any = {
            headers: this.state.headers,
            json: true
        };
        // request song analysis from spotify
        axios.get(trackAnalysis_url + track.id, headers)
            .then(async (response) => {
                // access token is expired, we must request a new one
                if (response.status === 401) {
                    await this.refreshToken();
                    this.fetchTrackData({ track, progress });
                }
                // no error, proceed
                else {
                    let analysis = response.data;
                    // if the track has no analysis data, don't visualize it
                    if (
                        analysis === undefined ||
                        analysis["beats"] === undefined ||
                        analysis["beats"].length == 0
                    ) {
                        this.state.visualizer.hasAnalysis = false;
                    } else {
                        this.state.visualizer.hasAnalysis = true;
                        // adjust beat data for ease of use
                        // TODO Normalize
                        // normalizeIntervals(state, { track, analysis });
                    }
                    // account for time to call api in initial timestamp
                    var initialTimestamp = Date.now() - (Date.now() - timestamp);
                    //TODO
                    // this.state.funcs.syncTrackProgress(this.state, progress, initialTimestamp);
                    // set the new currently playing song
                    // this.state.funcs.setCurrentlyPlaying(this.state, {
                    //     track,
                    //     analysis
                    // });
                    return {status: ApiResponse.WrongPlayback, 
                        data: {
                            track: track,
                            analysis: analysis,
                            progress: progress, 
                            initialTimestamp: initialTimestamp
                        }};
                }
            })
    };
}