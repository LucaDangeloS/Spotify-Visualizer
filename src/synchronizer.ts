import { APIFetcherI, ApiResponse } from './api_controller';
import { TrackController } from './track_controller';
import { pingDelay } from './config/config.json';
import { delay } from './utils';
import State from './state';


export default class Synchronizer {
    private verbose: boolean = false;
    private pingLoop: ReturnType<typeof setTimeout> = null;

    constructor(private api: APIFetcherI, private trackController: TrackController, private state: State, verbose?: boolean) {
        this.api = api;
        this.trackController = trackController;
        this.verbose = verbose;
        this.state = state;
    }

    // -- Public methods -- //
    public initialize() {
        if (this.verbose) {
            console.log("Initializing synchronizer");
        }
        this.startPingLoop();
    }

    public terminate() {
        this.stopPingLoop();
        this.trackController.stopVisualizer();
        if (this.verbose) {
            console.log("\n\t==========\n\tTERMINATED\n\t==========\n");
        }
    }

    // -- Private methods -- //
    /**
     * Establishes ping loop to query current track progress 
     */
    private async ping(): Promise<void> {
        let res = await this.api.fetchCurrentlyPlaying(this.state);
        this.processResponse(res);
        this.pingLoop = setTimeout(() => { this.ping() }, pingDelay);
    }

    private startPingLoop(): void {
        this.pingLoop = setTimeout(() => { this.ping() }, pingDelay);
    }

    private stopPingLoop(): void {
        if (this.pingLoop !== null) {
            clearTimeout(this.pingLoop);
        }
        this.trackController.stopVisualizer();
    }

    private processResponse(res: {status: ApiResponse, data?: any}) {
        if (this.verbose) {
            console.log("status: " + res.status);
        }
        switch (res.status) {
            case ApiResponse.Ok: {
                break;
            }
            case ApiResponse.VizOff: {
                this.trackController.startVisualizer();
                break;
            }

            case ApiResponse.NoTrack: {
                this.trackController.stopVisualizer();
                break;
            }

            case ApiResponse.NoPlayback: {
                this.trackController.stopVisualizer();
                break;
            }

            case ApiResponse.WrongPlayback: {
                this.trackController.syncTrackProgress(
                    res.data.progress,
                    res.data.initialTimestamp
                );
                this.trackController.setCurrentlyPlaying(
                    res.data.track,
                    res.data.analysis
                );
                break;
            }

            case ApiResponse.DeSynced: {
                this.trackController.stopBeatLoop();
                this.trackController.syncTrackProgress(
                    res.data.progress,
                    res.data.initialTimestamp
                );
                this.trackController.syncBeats();
                break;
            }

            case ApiResponse.Error: {
                console.error(res.data);
                // process.exit(1);
                break;
            }
        }
    }
}