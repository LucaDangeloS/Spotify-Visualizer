<div align="center"> <h1><strong>🎵 Spotify Visualizer 🎵</strong></h1> </div>

This is a rewritten version in TypeScript of my previous Spotify Visualizer, originally written in pure JavaScript.

**Note**: This is an underway project (Check <a href="#todos">TODOs</a>)

<sub>Original project inspired from [here](https://github.com/lukefredrickson/spotify-led-visualizer).</sub>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project-and-goals">About the project and goals</a>
      <ul>
        <li><a href="#preview-videos">Preview Videos</a></li>
        <li><a href="#balancing-simplicity-and-features">Balancing Simplicity and Features</a></li>
    </ul>
    </li>
    <li><a href="#features">Features</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#dependencies">Dependencies</a></li>
        <li><a href="#usage">Usage</a></li>
    </ul>
    <li><a href="#todos">TODOs</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>


# About the project and goals
The goal of this project is to provide a centralized, modular and scalable spotify visualizer server, where anyone can write their own client (visualizer) to interact with the server and create custom visualizations.

The API processing is delegated to a central server while multiple clients can process the song interpretation as they see fit (e.g. a ws2812b LED strip connected to a Raspberry Pi, a web page that changes the background color accordingly, etc.). The server-client communication is done through SocketIO.

Eventually there will also be a WebApp where parameters and color schemes can be changed for each individual visualizer connected to the server.

## Preview Videos
Previews with a WS2812b LED strip connected to a Rpi with a client connected over WiFi to the visualizer server. \
https://youtu.be/3Z2Jqpxq29M \
https://youtu.be/PM9xYnZyaM0 

## Balancing Simplicity and Features
I want to keep this as simple as posible, so *anyone* can copy paste 40 lines of code to have a highly customizable visualizer at home. However, adding more fancy features usually requires clients to have , thus straying from the initial goal of this project.

To overcome this I have planned on adding these features as optionals so that more advanced users can take the full advantage of this project, while not letting down people that just want to see some fancy lights blinking. If you have any advice or ideas, please let me know!
<br><br/>

# Features
- Spotify API token refresh on each individual session
- A simple webapp for token authorization flow in spotify
- A backend for the Spotify API processing in nodejs
- Song Beat and Section synchronization
- Beat and Section confidence filtering
- Reactiveness to the song, meaning color jumps are larger during the chorus, for example
<br><br/>

# Getting Started
## Prerequisites
- Spotify account
- node
  - npm/pnpm (node packet manager)
- SocketIO client (for the clients)
<br><br/>
## Dependencies
Install all node dependencies executing this in the root directory
```console
npm install
```
Then create a ```.env``` in the root folder with the following keys:
```
CLIENT_ID=
CLIENT_SECRET=
```
And fill the values with your spotify client ID and Secret \
You can get them [here](https://developer.spotify.com/dashboard/applications), creating an app and copying the client ID and Client Secret from the page
## Usage
The server can be executed with:
```console
npm start
```
Or compiled with:
```console
tsc
```

# TODOs
- [x] Implement color cycling
- [x] Implement token refresh in mid-playback
- [x] Figure out a way to delegate the song interpretation to the server
- [x] Add support for multiple visualizers
- [x] Implement socket communication
- [x] Implement individual visualizer customization
- [x] Make color jump related to song attributes
- [x] Standardize the message exchanges from server to visualizers
- [x] Add parameter for brightness
- [ ] Fix color palette creations so the colors chosen are more predominant
- [ ] Add option for in color palette jump (just shift)
- [ ] Solve missing song attributes bug when song changes
- [ ] Solve colors flickering when song changes
- [ ] Implement reliable over network communication
- [ ] Fine tune palette sizes
- [ ] Optimize beat steps to omit the beats lower that then confidence threshold
- [ ] Make the webapp for parameters tweaking
- [ ] Code clean-up (duh)


### License
[GPL-3.0-or-later](https://opensource.org/licenses/GPL-3.0)
