import { token_url, trackAnalysis_url, currentlyPlaying_url } from "./config/network-info.json";
import { syncOffsetThreshold } from "./config/config.json";
import { delay, normalizeIntervals } from "./utils";
import { readFileSync } from "fs";
import State from "./state";
import axios, { AxiosError, AxiosResponse } from "axios";
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
    waitForToken(timeout?: number): Promise<boolean>;
    fetchCurrentlyPlaying(state: State): Promise<{status: ApiResponse, data?: any}>;
    refreshToken(): void;
}

// Spotify API Fetcher
export class APIFetcher implements APIFetcherI {
    private _accessToken: string;
    private _expireTimestamp: Date;
    private verbose: boolean = false;
    private headers: Object = {};
    
    constructor(private client_id: string, private client_secret: string, verbose?: boolean) {
        this.verbose = verbose;
        this.client_id = client_id;
        this.client_secret = client_secret;
        // try {
        //     this.refreshToken();
        // } catch(err) {}
    }

    private async testToken(): Promise<boolean> {
        let headers: any = {
            headers: this.headers,
            json: true
        };
        var s = -1;
        // request the currently playing song from spotify API
        await axios.get(currentlyPlaying_url, headers)
            .then((response: AxiosResponse) => {
                s = response.status;
            }).catch((err: AxiosError) => {});
        if (this.verbose) {
            console.log("Request status: " + s);
        }
        return (s <= 204 && s >= 200);
    }

    // Setters
    public set accessToken(res: { access_token: string; expires_in: number; }) {
        this._accessToken = res.access_token;
        this._expireTimestamp = new Date(Date.now() + res.expires_in * 1000);
        this.headers = { Authorization: "Bearer " + res.access_token };

        if (this.verbose) {
            console.log("access token set " + this._accessToken);
            console.log("expire timestamp set " + this._expireTimestamp);
        }
    }

    // -- Public methods -- //
    public async waitForToken(timeout: number = 10000): Promise<boolean> {
        let sleep_time = 1000;
        if (this.verbose) {
            console.log("Testing token...");
        }
        if (timeout <= 0) return false;
        if (!(await this.testToken())) {
            await this.refreshToken();
            await delay(sleep_time);
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
            .then((res: AxiosResponse) => {
                this.accessToken = res.data;
            })
            .catch((err: AxiosError) => {
                throw new Error(err.message);
            })
    }
    
    /**
     * gets the currently playing song + track progress from spotify API
     */
     public async fetchCurrentlyPlaying(state: State): Promise<{status: ApiResponse, data?: any}> {
        // grab the current time
        var timestamp = Date.now();
        let headers: any = {
            headers: this.headers,
            json: true
        };
        let ret = null;
        let refresh_token = false;
        let aux = null;
        // request the currently playing song from spotify API
        await axios.get(currentlyPlaying_url, headers)
            .then((response: AxiosResponse) => {
                // no device is playing music
                if (response.status == 204) {
                    if (this.verbose) {
                        console.log("\nNo playback detected");
                    }
                    ret = {status: ApiResponse.NoPlayback};
                } else {
                    if (this.verbose) {
                        console.log("\nDetected playing: " + response.data.item.name);
                    }

                    aux = {
                        track: response.data.item,
                        playing: response.data.is_playing,
                        // account for time to call api in progress
                        progress: response.data.progress_ms + (Date.now() - timestamp)
                    }
                }
            }).catch((err: AxiosError) => {
                if (err.response!.status == 401) {
                    refresh_token = true;
                } else
                    ret = {status: ApiResponse.Error, data: err.response};
            });

        if (refresh_token) {
            if (this.verbose) {
                console.log("Refreshing token...");
            }
            await this.refreshToken();
            ret = await this.fetchCurrentlyPlaying(state);
        } else if (aux != null) {
            ret = await this.processResponse(state, aux);
        }
        return ret || {status: ApiResponse.Error, data: null};
    };


    // -- Private methods -- //
    /**
     * figure out what to do, according to state and track data
     */
     private async processResponse(state: State, { track, playing, progress }) : Promise<{status: ApiResponse, data?: any}>{
        let songsInSync =
            JSON.stringify(state.visualizer.currentlyPlaying) ===
            JSON.stringify(track);
        
        let progressStats = {
            client: state.visualizer.trackProgress,
            server: progress,
            error: state.visualizer.trackProgress - progress
        };

        let ret = null;

        if (this.verbose) {
            console.log(`\nclient progress: ${progressStats.client}ms`);
            console.log(`server progress: ${progressStats.server}ms`);
            console.log(`Sync error: ${Math.round(progressStats.error)}ms\n`);
        }

        if (track === null || track === undefined) {
            ret = {status: ApiResponse.Ok}
        }
    
        // if something is playing, but visualizer isn't on
        if (playing && !state.visualizer.active) {
            // start the visualizer if the songs are synced
            if (songsInSync) {
                ret = {status: ApiResponse.VizOff};
            }
            // otherwise, get the data for the new track
            ret = await this.fetchTrackData(state, { track, progress });
        }
    
        // if nothing is playing but the visualizer is active
        if (!playing && state.visualizer.active) {

            ret = {status: ApiResponse.NoTrack};
        }
    
        // if the wrong song is playing
        if (playing && state.visualizer.active && !songsInSync) {
            // get the data for the new track
            // TODO
            // stopVisualizer(state);
            ret = await this.fetchTrackData(state, { track, progress });
        }
    
        // if the approximate track progress and the api track progress fall out of sync by more than 250ms
        // resync the progress and the beat loop
        if (
            playing &&
            state.visualizer.active &&
            songsInSync &&
            Math.abs(progressStats.error) > syncOffsetThreshold
        ) {
            var initialTimestamp = Date.now();

            ret = {status: ApiResponse.DeSynced, 
                data: {progress: progress, initialTimestamp: initialTimestamp}};
        }
    
        // keep the ping loop going
        // ping(state);
        return ret || {status: ApiResponse.Ok};
    }


    /**
     * gets the song analysis (beat intervals, etc) for the current song from the spotify API
     */
    private async fetchTrackData(state: State, { track, progress }): Promise<{status: ApiResponse, data?: any}>{
        // fetch the current time
        let timestamp = Date.now();
        let headers: any = {
            headers: this.headers,
            json: true
        };
        let ret = null;
        let refresh_token = false;
        // request song analysis from spotify
        await axios.get(trackAnalysis_url + track.id, headers)
            .then((response: AxiosResponse) => {
                let analysis = response.data;
                // if the track has no analysis data, don't visualize it
                if (
                    analysis === undefined ||
                    analysis["beats"] === undefined ||
                    analysis["beats"].length == 0
                ) {
                    state.visualizer.hasAnalysis = false;
                } else {
                    state.visualizer.hasAnalysis = true;
                    normalizeIntervals(state, { track, analysis });
                }
                // account for time to call api in initial timestamp
                var initialTimestamp = Date.now() - (Date.now() - timestamp);

                ret = {status: ApiResponse.WrongPlayback, 
                    data: {
                        track: track,
                        analysis: analysis,
                        progress: progress, 
                        initialTimestamp: initialTimestamp
                    }};
                
            }).catch((err: AxiosError) => {
                if (err.response!.status == 401) {
                    refresh_token = true;
                } else
                    ret = {Status: ApiResponse.Error, data: err.response}
            });

        if (refresh_token) {
            await this.refreshToken();
            ret = await this.fetchTrackData(state, { track, progress });
        }
        return ret || {Status: ApiResponse.Error, data: null};
    };
}