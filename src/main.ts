import Server from './requests';
import State from './State';
import { frontEndPort, visualizerPort } from "./config/network-info.json";
require('dotenv').config();

const state = new State(()=>{}, ()=>{}, ()=>{}, ()=>{}, ()=>{});
const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, true);
server.start();
// setTimeout(() => server.refreshToken(), 6000)