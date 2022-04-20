import { AxiosResponse } from "axios";

export interface refreshTokenResponseI {
    access_token: string, 
    expires_in: number;
}

export interface trackI {
    trackId: string,
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

export enum ApiStatusCode {
    Ok, // Next Ping
    VizOff, // Start Viz
    NoPlayback, // Stop Viz
    ChangedPlayback, // SyncTrackProgress | track, analysis, progress, initialTimestamp
    DeSynced, // SyncTrackProgress | progress, initialTimestamp
    Unauthorized, // RefreshToken
    Error, // Error
};
export interface ApiResponse {
    status: ApiStatusCode,
    data: trackInfoI | progressInfoI | AxiosResponse
}