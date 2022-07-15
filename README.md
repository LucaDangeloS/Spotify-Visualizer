<div align="center"> <h1><strong>🎵 Spotify Visualizer 🎵</strong></h1> </div>

This is a rewritten version in TypeScript of my previous Spotify Visualizer, originally written in pure JavaScript.

**Note**: This is an underway project (Check <a href="#todos">TODOs</a>)

<sub>Original project inspired from [here](https://github.com/lukefredrickson/spotify-led-visualizer).</sub>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project-and-goals">About the project and goals</a>
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
The goal of this project is to provide a centralized, modular and expandable spotify visualizer.

The API processing is delegated to a central server while multiple custom visualizers can visualize the song interpretation as they see fit (e.g. a ws2812b LED strip connected to a Raspberry Pi, a web page that changes the background color accordingly, etc.)

There would also be a WebApp where parameters and color schemes can be changed for each individual visualizer connected to the server.

Also looking forward to adding HUE support in a future.
<br><br/>

# Features
- Spotify API token refresh on each individual session
- A simple webapp for token authorization flow in spotify
- A backend for the Spotify API processing in nodejs
- Song Beat and Section synchronization
- Beat and Section confidence filtering
<br><br/>

# Getting Started
## Prerequisites
- Spotify account
- node
  - npm (node packet manager)
<br><br/>
## Dependencies
Install all node dependencies executing this in the root directory
```console
npm install
```
<br><br/>
Then create a ```.env``` in the root folder with the following keys:
```
CLIENT_ID=
CLIENT_SECRET=
```
And fill the values with your spotify client ID and Secret 

You can get them [here](https://developer.spotify.com/dashboard/applications), creating an app and copying the client ID and Client Secret from the page
<br><br/>
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
- [x] Implement socket communication
- [x] Standardize the message exchanges from server to visualizers
- [x] Add support for multiple visualizers
- [ ] Implement individual visualizer customization
- [ ] Make color jump related to song volume
- [ ] Fine tune palette sizes
- [ ] Find a way for the server to know how many colors have been consumed in visualizer
- [ ] Optimize beat steps to omit the beats lower that then confidence threshold
- [ ] Make the webapp for parameters tweaking
- [ ] Code clean-up (duh)


### License
[GPL-3.0-or-later](https://opensource.org/licenses/GPL-3.0)
