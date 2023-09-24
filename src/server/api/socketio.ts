import State from "/models/state";
import Synchronizer from "/spotify/synchronizer";
import { Server, Socket } from 'socket.io';


// Server should have State and Synchronizer
export default class SocketIOApi {

    server = new Server({pingTimeout: 5000, cors:{origin:'*'}});

    constructor(private state: State, private synchronizer: Synchronizer, private port: number, private verbose: boolean = false) {
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

    manageConnection(socket: Socket) {
        // Attach listeners to the socket
        socket.on('shutdown', () => {
            if (this.verbose) {
                console.log("Shutdown requested");
            }
            this.synchronizer.stop();
        });

        socket.on('start', () => {
            if (this.verbose) {
                console.log("Start requested");
            }
            this.synchronizer.start();
        });
    }
}