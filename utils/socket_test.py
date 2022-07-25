# Python raw socket client to connect to a server on port 3000
# and send a message

import asyncio
import socketio
import pygame
import timeit

HOST = 'http://localhost'
PORT = 5000
FPS = 30
DISPLAY_WIDTH = 600
DISPLAY_HEIGHT = 600
sio = socketio.Client(logger=False, engineio_logger=False)

class Colors():
    transition = []
    colors = ['#ffffff']

    @classmethod
    def message(cls, data):
        # print(f"{data} from socket {sio.sid} {sio.get_sid()}")
        cls.transition = data['transition']
        cls.colors = data['colors']

    @classmethod
    def getTransitionColor(cls):
        return cls.transition.pop(0)


async def main():
    colors = Colors()
    idx = 0
    pygame.init()

    @sio.on('connect')
    def on_connect():
        print('Connected')

    @sio.on('beat')
    def getTransitionColor(data):
        # print("Received data")
        colors.message(data)

    sio.connect(f"{HOST}:{PORT}")

    display = pygame.display.set_mode((DISPLAY_WIDTH, DISPLAY_HEIGHT))
    clock = pygame.time.Clock()

    while True:
        if (colors.transition):
            pygame.draw.rect(display, pygame.Color(colors.transition.pop(0)), (0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT))
        else:
            pygame.draw.rect(display, pygame.Color(colors.colors[idx]), (0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT))
            idx = (idx + 1) % len(colors.colors)
    
            
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                sio.disconnect()
                exit(0)
        
        pygame.display.update()
        clock.tick(FPS)


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as e:
        print(e)
        exit(1)
