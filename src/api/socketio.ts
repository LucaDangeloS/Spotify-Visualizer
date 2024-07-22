import State from "/models/state";
import Synchronizer from "/spotify/synchronizer";
import { Server, Socket } from 'socket.io';
import * as command from "./commands";

// Server should have State and Synchronizer
export default class SocketIOApi {

    server = new Server({pingTimeout: 5000, cors:{origin:'*'}});

    constructor(
        private state: State, 
        private synchronizer: Synchronizer, 
        private port: number, 
        private verbose: boolean = false) {
    }
    
    public start() {
        this.server.listen(this.port);
        this.server.on('connection', (socket: Socket) => {
            this.manageConnection(socket);
        });
        if (this.verbose) {
            console.log(`SocketIO config server started on port ${this.port}`)
        }
    }

    public stop() {
        this.server.close(() => {
            if (this.verbose) {
                console.log("SocketIO config server closed")
            }
        });
    }

    private attachListener(socket: Socket, event: string, func: Function, funcArgs: any[],  verboseText?: string) {
        socket.on(event, () => {
            if (this.verbose && verboseText) {
                console.log(verboseText)
            }
            func(...funcArgs);
        });
    }

    private attachArgListener(socket: Socket, 
        event: string,
        func: Function, 
        funcArgs: any[],  
        verboseText?: string) {

        socket.on(event, (data : any) => {
            if (this.verbose && verboseText) {
                console.log(`${verboseText} ${data}`)
            }
            // extract all the fields from data and put them into an array
            // so far no command receives more than one data parameters
            // type check
            try {
                func(...funcArgs, data);
            } catch (e) {
                console.log(`Error calling ${func.name} with argument ${data}: ${e.message}`);
            }
        });
    }

    manageConnection(socket: Socket) {
        // Attach listeners to the socket
        this.attachListener(socket, "stop", command.StopServer, [this.synchronizer], "Shutdown requested");
        this.attachListener(socket, "start", command.StartServer, [this.synchronizer], "Start requested");
        this.attachListener(socket, "toggle_sync", command.ToggleSync, [this.state], "Toggle sync requested");
        
        // Sync commands
        this.attachArgListener(socket, "set_loudness_sync", command.SetSyncLoudnessSensibility, [this.state], "Set sync Loudness sensibility");
        this.attachArgListener(socket, "set_base_transition_angle_sync", command.SetSyncBaseTransitionAngle, [this.state], "Set sync base transition angle");
        this.attachArgListener(socket, "set_min_beat_conf_sync", command.SetSyncMinBeatConfidence, [this.state], "Set sync min beat confidence");
        this.attachArgListener(socket, "set_max_beat_conf_sync", command.SetSyncMaxBeatConfidence, [this.state], "Set sync max beat confidence");
        
        // Server commands
        this.attachArgListener(socket, "set_global_delay", command.SetGlobalDelay, [this.state], "Set global visualizer delay");
        this.attachArgListener(socket, "set_ping_interval", command.SetPingInterval, [this.synchronizer], "Set Spotify ping interval");
        this.attachArgListener(socket, "set_sync_offset_threshold", command.SetSyncOffsetThreshold, [this.synchronizer], "Set sync offset threshold");
        // this.attachArgListener(socket, "set_palette_size", command.SetPaletteSize, [this.state], "Set palette size");
        this.attachListener(socket, "flush_visualizers_colors", command.FlushVisualizersColors, [this.state], "Cleared visualizers");

        // Visualizer commands
        // cycle modifier
        // transition modifier
        this.attachArgListener(socket, "flush_visualizer", command.FlushVisualizer, [this.state], "Flushed visualizer");
    }
}