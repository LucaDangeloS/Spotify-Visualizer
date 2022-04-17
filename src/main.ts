import Server from './server';
import State from './State';
import { APIFetcher } from './api_controller';
import { frontEndPort, visualizerPort } from "./config/network-info.json";
import { TrackController } from './track_controller';
require('dotenv').config();

const state = new State(()=>{}, ()=>{}, ()=>{}, ()=>{}, ()=>{});
const api = new APIFetcher(process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, true);
const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, api.accessToken, true);
const controller = new TrackController(state, api);
server.start();
// api.fetchCurrentlyPlaying();

// api.refreshToken();

setTimeout(()=>{ console.log(state.accessToken) }, 8000);