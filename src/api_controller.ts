import { token_url, trackAnalysis_url, currentlyPlaying_url } from "./config/network-info.json";
import { syncOffsetThreshold } from "./config/config.json";
import { delay, normalizeIntervals } from "./utils";
import { readFileSync } from "fs";
import State from "./state";
import axios, { AxiosError, AxiosResponse } from "axios";
import querystring from 'query-string';
import { analysisI, ApiResponse, ApiStatusCode, refreshTokenResponseI, trackI } from './types';

/*
* Many methods were borrowed from 
* https://github.com/lukefredrickson/spotify-led-visualizer
*/

// Spotify API Fetcher
export async function testToken(state: State): Promise<boolean> {
    let headers: any = {
        headers: state.headers,
        json: true
    };
    var s = -1;
    // request the currently playing song from spotify API
    await axios.get(currentlyPlaying_url, headers)
        .then((response: AxiosResponse) => {
            s = response.status;
        }).catch((err: AxiosError) => {});
    if (state.verbose) {
        console.log("Request status: " + s);
    }
    return (s <= 204 && s >= 200);
}

// -- Public functions -- //
export async function waitForToken(state: State, timeout: number = 10000): Promise<boolean> {
    let sleep_time = 1000;
    if (state.verbose) {
        console.log("Testing token...");
    }
    if (timeout <= 0) return false;
    if (!(await testToken(state))) {
        await refreshToken(state);
        await delay(sleep_time);
    } else {
        return true;
    }
    return await waitForToken(state, timeout - sleep_time);
}

// TODO change to boolean in the future
export async function refreshToken(state: State): Promise<void> {
    let refresh_token = readFileSync('./token.txt', 'utf-8');
    let refresh_url = token_url;
    let refresh_body = {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
    };
    let headers = {
        headers: {
            Authorization: `Basic ${Buffer.from(process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET).toString('base64')}`,
            "Content-Type": "application/x-www-form-urlencoded"
        }
    };
    state.headers = headers;
    if (state.verbose) {
        console.log("Refreshing token..." + headers);
    }
    await axios.post(refresh_url, querystring.stringify(refresh_body), headers)
        .then((res: AxiosResponse) => {
            let data: refreshTokenResponseI = res.data as refreshTokenResponseI;
            state.setAccessToken(data);
        })
        .catch((err: AxiosError) => {
            throw new Error(err.message);
        })
}

/**
 * gets the currently playing song + track progress from spotify API
 */
export async function fetchCurrentlyPlaying(state: State): Promise<ApiResponse> {
    // grab the current time
    var timestamp = Date.now();
    let headers: any = {
        headers: state.headers,
        json: true
    };
    let ret: ApiResponse = null;
    let aux = null
    // request the currently playing song from spotify API
    await axios.get(currentlyPlaying_url, headers)
        .then((response: AxiosResponse) => {
            // no device is playing music
            if (response.status == 204) {
                if (state.verbose) 
                    console.log("\nNo playback detected");
                ret = {status: ApiStatusCode.NoPlayback, data: null};
            } else {
                if (state.verbose) 
                    console.log("\nDetected playing: " + response.data.item.name);

                aux = {
                    track: response.data.item as trackI,
                    playing: response.data.is_playing,
                    // account for time to call api in progress
                    progress: response.data.progress_ms + (Date.now() - timestamp)
                };
            }
        }).catch((err: AxiosError) => {
            console.log("ERROR: " + err)
            if (err.response!.status == 401) 
                ret = {status: ApiStatusCode.Unauthorized, data: null}
            else
                ret = {status: ApiStatusCode.Error, data: err.response};
        });

    if (aux === null) return ret;
    return await processResponse(state, aux);
};


// -- Private functions -- //
/**
 * figure out what to do, according to state and track data
 */
async function processResponse(state: State, { track, playing, progress }) : Promise<ApiResponse>{
    let songsInSync =
        JSON.stringify(state.visualizer.currentlyPlaying) ===
        JSON.stringify(track);
    
    let progressStats = {
        client: state.visualizer.trackProgress,
        server: progress,
        error: state.visualizer.trackProgress - progress
    };

    let ret: ApiResponse = null;

    if (state.verbose) {
        console.log(`\nclient progress: ${progressStats.client}ms`);
        console.log(`server progress: ${progressStats.server}ms`);
        console.log(`Sync error: ${Math.round(progressStats.error)}ms\n`);
    }

    let aux: number = playing + state.visualizer.active;

    switch (true) {
        // no track detected
        case (aux == 0 || track === null || track === undefined):
            ret = {status: ApiStatusCode.Ok, data: null};
            break;

        // track has changed
        case (aux == 2 && !songsInSync):
            ret = await fetchTrackData(state, { track, progress });
            break;

        // track fell out of sync
        case (aux == 2 && songsInSync && Math.abs(progressStats.error) > syncOffsetThreshold):
            var initialTimestamp = Date.now();
            ret = {
                status: ApiStatusCode.DeSynced, 
                data: {progress: progress, initialTimestamp: initialTimestamp}
            };
            break;

        // track has resumed
        case (aux == 1 && !state.visualizer.active):
            if (songsInSync)
                ret = {status: ApiStatusCode.VizOff, data: null};
            else 
                ret = await fetchTrackData(state, { track, progress });
            break;

        // track is stopped
        case (aux == 1 && !playing):
            ret = {status: ApiStatusCode.NoPlayback, data: null};
            break;

        default:
            ret = {status: ApiStatusCode.Ok, data: null}
            break;
            
    }

    return ret;
}


/**
 * gets the song analysis (beat intervals, etc) for the current song from the spotify API
 */
async function fetchTrackData(state: State, { track, progress }): Promise<ApiResponse>{
    // fetch the current time
    let timestamp = Date.now();
    let headers: any = {
        headers: state.headers,
        json: true
    };
    let ret: ApiResponse = null;
    // request song analysis from spotify
    await axios.get(trackAnalysis_url + track.id, headers)
        .then((response: AxiosResponse) => {
            let analysis: analysisI = response.data;
            // if the track has no analysis data, don't visualize it
            if (
                analysis === undefined ||
                analysis.beats === undefined ||
                analysis.beats.length == 0
            ) {
                state.visualizer.hasAnalysis = false;
            } else {
                state.visualizer.hasAnalysis = true;
                normalizeIntervals(state, { track, analysis });
            }
            // account for time to call api in initial timestamp
            var initialTimestamp = Date.now() - (Date.now() - timestamp);

            ret = {status: ApiStatusCode.ChangedPlayback, 
                data: {
                    track: track,
                    analysis: analysis,
                    progress: progress, 
                    initialTimestamp: initialTimestamp
                }};
            
        }).catch((err: AxiosError) => {
            if (err.response!.status == 401) {
                ret = {status: ApiStatusCode.Unauthorized, data: null};
            } else
                ret = {status: ApiStatusCode.Error, data: err.response}
        });

    return ret;
};
