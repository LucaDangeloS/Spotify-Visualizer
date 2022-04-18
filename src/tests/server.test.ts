import Server from 'server';
import State from 'state';
import { APIFetcher, ApiResponse } from 'api_controller';
import { baseUrl, frontEndPort, visualizerPort } from "config/network-info.json";
import { TrackController } from 'track_controller';
import axios from 'axios';

require('dotenv').config();
const state = new State();
const api = new APIFetcher(process.env.CLIENT_ID, process.env.CLIENT_SECRET, state);

describe('Front-end server tests', () => {
    const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, api);

    test('Server start', () => {
        expect(server).toBeInstanceOf(Server);
        server.start();
    });

    test('Server up', async () => {
        await axios.get(`${baseUrl}:${frontEndPort}`)
        .then(res => {
            expect(res.status).toBe(200);
            expect(res.data).not.toBe(undefined);
        })
        .catch(
            err => {
                console.error(err);
            }
        )
    })

    test('Path "/login"', async () => {
        await axios.get(`${baseUrl}:${frontEndPort}/login`)
        .then(res => {
            expect(res.status).toBe(200);
            expect(res.data).not.toBe(undefined);
        })
        .catch(
            err => {
                console.error(err.response.data);
            }
        )
    })

    test('Path "/callback"', async () => {
        await axios.get(`${baseUrl}:${frontEndPort}/callback`)
        .then(res => {
            expect(res.status).toBe(200);
            expect(res.data).not.toBe(undefined);
        })
        .catch(
            err => {
                console.error(err.response.data);
            }
        )
    })

    afterAll(() => {
        return server.close();
    })
})