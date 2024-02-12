import { token_url, trackAnalysis_url, currentlyPlaying_url } from "../config/network-info.json";
import { delay, normalizeIntervals } from "./utils";
import { readFileSync } from "fs";
import State from "/models/state";
import { progressInfoI, trackInfoI } from "/models/spotifyApiInterfaces";
import axios, { AxiosError, AxiosResponse } from "axios";
import querystring from 'query-string';
import { analysisI, trackI } from '/models/spotifyApiInterfaces';
import events from "events";
/*
* Many methods were borrowed from 
* https://github.com/lukefredrickson/spotify-led-visualizer
*/

export interface refreshTokenResponseI {
    access_token: string, 
    expires_in: number;
}

export const ApiStatusCode = {
    "Ok" : 0, // --> Next Ping
    "VizOff" : 1, // --> Start Viz
    "NoPlayback" : 2, // --> Stop Viz
    "ChangedPlayback" : 3, // --> SyncTrackProgress | track, analysis, progress, initialTimestamp
    "DeSynced" : 4, // --> SyncTrackProgress | progress, initialTimestamp
    "Unauthorized" : 5, // --> RefreshToken
    "Error" : 6, // --> Error
} as const;
export type ApiStatusCodeT = typeof ApiStatusCode[keyof typeof ApiStatusCode]

export interface ApiResponse {
    status: ApiStatusCodeT,
    data: trackInfoI | progressInfoI | AxiosResponse
}

// Spotify API Fetcher
export async function testToken(state: State): Promise<boolean> {
    let headers = {
        headers: state.headers,
        json: true
    };
    let s = -1;
    // request the currently playing song from spotify API
    await axios.get(currentlyPlaying_url, headers)
        .then((response: AxiosResponse) => {
            s = response.status;
        }).catch((err: AxiosError) => {
            console.error(err.message);
        });
    if (state.verbose) {
        console.log(`Tested token returned status: ${s}`);
    }
    return (s <= 204 && s >= 200);
}

// -- Public functions -- //
export async function waitForToken(state: State): Promise<boolean> {
    if ((await testToken(state)) || (await refreshToken(state)) ) {
        return true;
    }
    console.log("The app needs manual authentication...")
    await events.once(state.setTokenEventHandler, "set_token");
    return (await testToken(state));
}

export async function refreshToken(state: State): Promise<boolean> {
    let refresh_token: string;
    let refresh_url: string = token_url;
    let ret: boolean = false;
    try {
        refresh_token = readFileSync('token.txt', 'utf-8');
    } catch (err) {
        return ret;
    }
    let refresh_body = {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
    };
    let headers = {
        headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')}`,
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }
    
    if (state.verbose) {
        console.log("Refreshing token...");
    }
    await axios.post(refresh_url, querystring.stringify(refresh_body), headers)
        .then((res: AxiosResponse) => {
            let data: refreshTokenResponseI = res.data as refreshTokenResponseI;
            state.setTokenEventHandler.emit('set_token', data);
            ret = true;
        })
        .catch((err: AxiosError) => {
            ret = false;
        })

    return ret;
}

/**
 * gets the currently playing song + track progress from spotify API
 */
export async function fetchCurrentlyPlaying(state: State, syncOffsetThreshold: number): Promise<ApiResponse> {
    // grab the current time
    let timestamp = Date.now();
    let headers = {
        headers: state.headers,
        json: true
    };
    let ret: ApiResponse = null;
    let aux = null
    // request the currently playing song from spotify API
    await axios.get(currentlyPlaying_url, headers)
        .then((response: AxiosResponse) => {
            // no device is playing music
            if (response.status === 204) {
                if (state.verbose) 
                    console.log("\nNo playback detected");
                ret = {status: ApiStatusCode.NoPlayback, data: null};
            } else {
                if (state.verbose) 
                    console.log("\nDetected playing: " + response.data.item.name);

                aux = {
                    track: response.data.item as trackI,
                    playing: response.data.is_playing,
                    // account for time to call api in progress (+)
                    progress: response.data.progress_ms + (Date.now() - timestamp)/2
                };
            }
        }).catch((err: AxiosError) => {
            // TODO: Solve issue "TypeError: Cannot read properties of undefined (reading 'status')"
            if (err.response?.status === 401) {
                ret = {status: ApiStatusCode.Unauthorized, data: null}
            }
            else {
                ret = {status: ApiStatusCode.Error, data: err.response};
            }
        });

    if (aux === null) return ret;
    return await processResponse(state, aux, syncOffsetThreshold);
};


// -- Private functions -- //
/**
 * figure out what to do, according to state and track data
 */
async function processResponse(
        state: State, 
        { track, playing, progress }: {track: trackI, playing: boolean, progress: number},
        syncOffsetThreshold: number
    ) : Promise<ApiResponse>{ 
    let songsInSync =
        JSON.stringify(state.trackInfo.currentlyPlaying) ===
        JSON.stringify(track);
    
    let progressStats = {
        client: state.trackInfo.trackProgress,
        server: progress,
        error: state.trackInfo.trackProgress - progress
    };

    let ret: ApiResponse = null;

    if (state.verbose) {
        console.log(`\nclient progress: ${progressStats.client}ms`);
        console.log(`server progress: ${progressStats.server}ms`);
        console.log(`Sync error: ${Math.round(progressStats.error)}ms\n`);
    }

    let aux: number = Number(playing) + Number(state.trackInfo.active);

    switch (true) {
        // no track detected
        case (aux === 0 || track === null || track === undefined):
            ret = {status: ApiStatusCode.Ok, data: null};
            break;

        // track has changed
        case (aux === 2 && !songsInSync):
            ret = await fetchTrackData(state, { track: track, progress: progress });
            break;

        // track fell out of sync
        case (aux === 2 && songsInSync && Math.abs(progressStats.error) > syncOffsetThreshold):
            let initialTimestamp = Date.now();
            ret = {
                status: ApiStatusCode.DeSynced, 
                data: {progress: progress, initialTimestamp: initialTimestamp}
            };
            break;

        // track has resumed
        case (aux === 1 && !state.trackInfo.active):
            if (songsInSync) {
                ret = {status: ApiStatusCode.VizOff, data: null};
            } else {
                ret = await fetchTrackData(state, { track: track, progress: progress });
            } 
            break;

        // track is stopped
        case (aux === 1 && !playing):
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
async function fetchTrackData(state: State, { track, progress }: {track: trackI, progress: number}): Promise<ApiResponse>{
    // fetch the current time
    let timestamp = Date.now();
    let headers = {
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
                analysis.beats.length === 0
            ) {
                state.trackInfo.hasAnalysis = false;
            } else {
                state.trackInfo.hasAnalysis = true;
                normalizeIntervals(state, { track: track, analysis });
            }
            // account for time to call api in initial timestamp (-)
            let initialTimestamp = Date.now() - (Date.now() - timestamp)/2;
            
            ret = {
                status: ApiStatusCode.ChangedPlayback, 
                data: {
                    track: track,
                    analysis: analysis,
                    progress: progress, 
                    initialTimestamp: initialTimestamp
                }};
            
        }).catch((err: AxiosError) => {
            if (err.response!.status === 401) {
                ret = {status: ApiStatusCode.Unauthorized, data: null};
            } else {
                ret = {status: ApiStatusCode.Error, data: err.response};
            }
        });

    return ret;
};
