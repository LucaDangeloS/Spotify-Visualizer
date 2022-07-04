import Server from '../io/server';
import State from '../state';
import { baseUrl, frontEndPort, visualizerPort } from "../config/network-info.json";
import axios, { AxiosError, AxiosResponse } from 'axios';

require('dotenv').config();
const state = new State();

describe('Front-end server tests', () => {
    const server = Server.init(frontEndPort, process.env.CLIENT_ID, process.env.CLIENT_SECRET, state, state.setAccessToken, false);

    test('Server start', () => {
        expect(server).toBeInstanceOf(Server);
        server.start();
    });

    test('Server up', async () => {
        await axios.get(`${baseUrl}:${frontEndPort}`)
        .then((res: AxiosResponse) => {
            expect(res.status).toBe(200);
            expect(res.data).not.toBe(undefined);
        })
        .catch(
            (err: AxiosError) => {
                console.error(err);
            }
        )
    })

    test('Path "/login"', async () => {
        await axios.get(`${baseUrl}:${frontEndPort}/login`)
        .then((res: AxiosResponse) => {
            expect(res.status).toBe(200);
            expect(res.data).not.toBe(undefined);
        })
        .catch(
            (err: AxiosError) => {
                console.error(err.response);
            }
        )
    })

    test('Path "/callback"', async () => {
        await axios.get(`${baseUrl}:${frontEndPort}/callback`)
        .then((res: AxiosResponse) => {
            expect(res.status).toBe(200);
            expect(res.data).not.toBe(undefined);
        })
        .catch(
            (err: AxiosError) => {
                console.error(err.response);
            }
        )
    })

    afterAll(() => {
        return server.close();
    })
})