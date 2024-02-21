import * as TrackController from './trackController';
import { pingDelay } from '../config/config.json';
import * as api from './apiController';
import State from '../models/state';
import { ApiResponse, ApiStatusCode } from './apiController';
import { trackInfoI, progressInfoI } from '../models/spotifyApiInterfaces';
import { syncOffsetThreshold as defaultSyncOffsetThreshold} from "../config/config.json";

/**
 * Class that handles the synchronization of the visualizer with the current track through Timeouts
 */
export default class Synchronizer {
    private verbose: boolean = false;
    private pingLoop: ReturnType<typeof setTimeout> = null;
    public isAutoControlled: boolean = false;
    public pingDelay: number = pingDelay;
    public active: boolean = false;
    public syncOffsetThreshold: number = defaultSyncOffsetThreshold;

    constructor(private state: State, verbose?: boolean) {
        this.state = state;
        this.verbose = verbose;
    }

    // -- Public methods -- //
    public start(auto: boolean = true): void {
        this.isAutoControlled = auto;
        if (this.active) {
            return;
        }
        this.active = true;
        if (this.verbose) {
            console.log("Initializing synchronizer");
        }
        this.startPingLoop();
    }

    public stop(auto: boolean = true) {
        this.isAutoControlled = auto;
        if (!this.active) {
            return;
        }
        this.active = false;
        this.stopPingLoop();
        TrackController.stopVisualizer(this.state);
        // TrackController.flushBeatQueue(this.state);
        if (this.verbose) {
            console.log("\n\t==========\n\tTERMINATED\n\t==========\n");
        }
    }

    // setter for clarity, despite the fact that the attribute is public
    public setAutoControlled(auto: boolean): void {
        this.isAutoControlled = auto;
    }

    // -- Private methods -- //
    /**
     * Establishes ping loop to query current track progress 
     */
    private async ping(): Promise<void> {
        let res = await api.fetchCurrentlyPlaying(this.state, this.syncOffsetThreshold);
        this.processResponse(res);
        this.pingLoop = setTimeout(() => { this.ping() }, this.pingDelay);
    }

    private startPingLoop(): void {
        // override previous ping loop
        if (this.pingLoop !== null) {
            clearTimeout(this.pingLoop);
        }
        this.pingLoop = setTimeout(() => { this.ping() }, this.pingDelay);
    }

    private stopPingLoop(): void {
        if (this.pingLoop !== null) {
            clearTimeout(this.pingLoop);
        }
        this.state.trackInfo.active = false;
    }

    private processResponse(res: ApiResponse): void {
        if (this.verbose) {
            console.log(`status: ${res.status}`);
        }
        switch (res.status) {
            case ApiStatusCode.Ok: {
                break;
            }
            case ApiStatusCode.VizOff: {
                TrackController.startVisualizer(this.state);
                break;
            }

            case ApiStatusCode.NoPlayback: {
                TrackController.stopVisualizer(this.state);
                this.state.trackInfo.active = false;
                break;
            }

            case ApiStatusCode.ChangedPlayback: {
                let data: trackInfoI = res.data as trackInfoI;
                TrackController.syncTrackProgress(
                    this.state,
                    data.progress,
                    data.initialTimestamp
                );
                TrackController.setCurrentlyPlaying(
                    this.state,
                    data.track,
                    data.analysis
                );
                break;
            }

            case ApiStatusCode.DeSynced: {
                let data: progressInfoI = res.data as progressInfoI;
                TrackController.stopBeatLoop(this.state);
                TrackController.syncTrackProgress(
                    this.state,
                    data.progress,
                    data.initialTimestamp
                );
                TrackController.syncBeats(this.state);
                break;
            }

            case ApiStatusCode.Unauthorized: {
                api.refreshToken(this.state);
                break;
            }

            case ApiStatusCode.Error: {
                if (this.verbose)
                    console.error(res.data);
                // process.exit(1);
                break;
            }

            default:
                break;
        }
    }
}