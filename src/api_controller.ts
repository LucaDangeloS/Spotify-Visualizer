import { token_url, trackAnalysis_url, currentlyPlaying_url } from "./config/network-info.json";
import { syncOffsetThreshold } from "./config/config.json";
import { normalizeIntervals } from "./utils";
import { readFileSync } from "fs";
import State from "./state";
import axios from "axios";
import querystring from 'query-string';


export enum ApiResponse {
    Ok, // Next Ping
    VizOff, // Start Viz
    NoTrack, // Stop Viz
    NoPlayback, // Next Ping
    WrongPlayback, // SyncTrackProgress | track, analysis, progress, initialTimestamp
    DeSynced, // SyncTrackProgress | progress, initialTimestamp
    Error, // Error
};
export interface APIFetcherI {
    set accessToken(token: { access_token: string; expires_in: number; });
    fetchCurrentlyPlaying(): Promise<{status: ApiResponse, data?: any}>;
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
        // try {
        //     this.refreshToken();
        // } catch(err) {}
    }

    private async testToken(): Promise<boolean> {
        let headers: any = {
            headers: this.state.headers,
            json: true
        };
        var s = -1;
        // request the currently playing song from spotify API
        await axios.get(currentlyPlaying_url, headers)
            .then((response) => {
                s = response.status;
            }).catch(err => { return false; });
        if (this.verbose) 
            console.log("Request status: " + s);
        return (s <= 204 && s >= 200);
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

    private delay(time: number): Promise<void> {
        return new Promise<void>((resolve) => setTimeout(resolve, time));
    }

    // -- Public methods -- //
    public async waitForToken(timeout: number = 6000): Promise<boolean> {
        let sleep_time = 1000;
        if (this.verbose)
            console.log("Testing token...");
        if (timeout <= 0) return false;
        if (!(await this.testToken())) {
            await this.refreshToken();
            await this.delay(sleep_time);
        } else {
            return true;
        }
        return await this.waitForToken(timeout - sleep_time);
    }

    // TODO change to boolean in the future
    public async refreshToken(): Promise<void> {
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
        await axios.post(refresh_url, querystring.stringify(refresh_body), headers)
            .then(res => {
                this.accessToken = res.data;
            })
            .catch(err => {
                if (this.verbose)
                    console.error(err.data.error);
                throw new Error(err);
            })
    }
    
    /**
     * gets the currently playing song + track progress from spotify API
     */
     public async fetchCurrentlyPlaying(): Promise<{status: ApiResponse, data?: any}> {
        // grab the current time
        var timestamp = Date.now();
        let headers: any = {
            headers: this.state.headers,
            json: true
        };
        // request the currently playing song from spotify API
        await axios.get(currentlyPlaying_url, headers)
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
        ).catch(err => {
            if (this.state.headers == null) {
                if (this.verbose)
                    console.error("No auth headers set");
            } else {
                if (this.verbose)
                    console.error(err.data.error);
                return {status: ApiResponse.Error};
            }
        });
        return {status: ApiResponse.Error};
    };


    // -- Private methods -- //
    /**
     * figure out what to do, according to state and track data
     */
     private async processResponse({ track, playing, progress }) : Promise<{status: ApiResponse, data?: any}>{
        let songsInSync =
            JSON.stringify(this.state.visualizer.currentlyPlaying) ===
            JSON.stringify(track);
        
        let progressStats = {
            client: this.state.visualizer.trackProgress,
            server: progress,
            error: this.state.visualizer.trackProgress - progress
        };

        let ret = null;

        if (this.verbose) {
            console.log(`\nclient progress: ${progressStats.client}ms`);
            console.log(`server progress: ${progressStats.server}ms`);
            console.log(`Sync error: ${Math.round(progressStats.error)}ms\n`);
        }

        if (track === null || track === undefined) {
            // TODO Ping method
            // return ping(this.state);
            ret = {status: ApiResponse.Ok}
        }
    
        // if something is playing, but visualizer isn't on
        if (playing && !this.state.visualizer.active) {
            // start the visualizer if the songs are synced
            if (songsInSync) {
                // TODO Start Visualizer
                // return startVisualizer(state);
                ret = {status: ApiResponse.VizOff};
            }
            // otherwise, get the data for the new track
            ret = await this.fetchTrackData({ track, progress });
        }
    
        // if nothing is playing but the visualizer is active
        if (!playing && this.state.visualizer.active) {
            // TODO Stop Visualizer
            // stopVisualizer(state);
            ret = {status: ApiResponse.NoTrack};
        }
    
        // if the wrong song is playing
        if (playing && this.state.visualizer.active && !songsInSync) {
            // get the data for the new track
            // TODO
            // stopVisualizer(state);
            ret = await this.fetchTrackData({ track, progress });
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
            ret = {status: ApiResponse.DeSynced, 
                data: {progress: progress, initialTimestamp: initialTimestamp}};
        }
    
        // keep the ping loop going
        // ping(state);
        return ret || {status: ApiResponse.Error};
    }


    /**
     * gets the song analysis (beat intervals, etc) for the current song from the spotify API
     */
    private async fetchTrackData({ track, progress }): Promise<{status: ApiResponse, data?: any}>{
        // fetch the current time
        let timestamp = Date.now();
        let headers: any = {
            headers: this.state.headers,
            json: true
        };
        let ret = null;
        // request song analysis from spotify
        await axios.get(trackAnalysis_url + track.id, headers)
            .then(async (response) => {
                // access token is expired, we must request a new one
                if (response.status === 401) {
                    await this.refreshToken();
                    return await this.fetchTrackData({ track, progress });
                }  else {
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
                        normalizeIntervals(this.state, { track, analysis });
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
                    ret = {status: ApiResponse.WrongPlayback, 
                        data: {
                            track: track,
                            analysis: analysis,
                            progress: progress, 
                            initialTimestamp: initialTimestamp
                        }};
                }
            });

        return ret || {Status: ApiResponse.Error};
    };
}