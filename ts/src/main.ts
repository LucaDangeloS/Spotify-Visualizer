import Server from './requests';
import './requests.ts';
require('dotenv').config();


const server = Server.init(1999, process.env.CLIENT_ID, process.env.CLIENT_SECRET);
server.start();