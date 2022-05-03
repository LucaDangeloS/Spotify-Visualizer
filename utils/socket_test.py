# Python raw socket client to connect to a server on port 3000
# and send a message

import asyncio
import socketio

HOST = 'http://localhost'
PORT = 5000

sio = socketio.Client()

@sio.on('beat')
def message(data):
    print(f"{data} from socket {sio.sid} {sio.get_sid()}")

@sio.on('connect')
def on_connect():
    print('connected')


sio.connect(f"{HOST}:{PORT}")