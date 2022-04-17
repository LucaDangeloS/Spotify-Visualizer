import Server from './server';
import State from './State';
import { APIFetcher } from './api_controller';
import { frontEndPort, visualizerPort } from "./config/network-info.json";
require('dotenv').config();

const state = new State(()=>{}, ()=>{}, ()=>{}, ()=>{}, ()=>{});
const api = new APIFetcher(process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, true);
const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, api, true);
server.start();
// setTimeout(() => server.refreshToken(), 6000)