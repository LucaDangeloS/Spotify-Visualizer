import { Server } from 'socket.io';
import 'socket.io';


export function createVisualizerSocket(port: number): Server {
    let server = new Server();
    server.listen(port);
    return server;
}