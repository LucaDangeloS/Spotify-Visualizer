import { baseUrl, frontEndPort, auth_url, token_url } from "../config/network-info.json";
import express, { Router, Request, Response } from 'express';
import axios, { AxiosError, AxiosResponse } from "axios";
import { refreshTokenResponseI } from "./apiController";
import cookieParser from "cookie-parser";
import querystring from "query-string";
import RestAPI from './rest_api';
import * as http from "http";
import State from "../state";
import crypto from 'crypto';
import cors from 'cors'
import path from "path";
import fs from "fs";


// Main Front-End Server with auth flow
export default class Server {
    private app : express.Application;
    private verbose: boolean = false;
    public server: http.Server = null;

    constructor(public readonly port: number, client_id: string, client_secret: string, state: State, tokenCallback: Function, verbose?: boolean) {
        this.verbose = verbose;
        this.port = port;
        this.app = express()
            .use(cookieParser())
            .use(cors())
            .use(FlowRouter.get(client_id, client_secret, tokenCallback))
            .use(RestAPI.get(state))
            .use(express.static(path.resolve(__dirname, '..') + "/public"));
    }

    start(): void {
        if (this.server == null)
            this.server = this.app.listen(this.port, () => {
                if (this.verbose) {
                    console.log("Server started on port " + this.port)
                }
            });
    }

    close(): void {
        if (this.server != null)
            this.server.close(() => {
                if (this.verbose) {
                    console.log("Server closed")
                }
            });
    }

    static init(port: number, client_id: string, client_secret: string, state: State, apiHook: Function, verbose?: boolean): Server { 
        return new Server(port, client_id, client_secret, state, apiHook, verbose);
    }

}

// FlowRouter from Front-End server
class FlowRouter {
    public router : Router;
    private staticFolder: string = path.resolve(__dirname, '..') + "/public";

    constructor(client_id: string, client_secret: string, accessTokenCallback: Function) {
        this.router = Router();
        const stateKey = "spotify_auth_state";
        const redirect_uri: string =  `${baseUrl}:${frontEndPort}/callback`;

        this.router.get("/", (req: Request, res: Response) => {
            res.sendFile(`${this.staticFolder}/index.html`);
        });

        this.router.get("/login", (req: Request , res: Response) => {
            //initialize random state ID and store in cookie
            let state = crypto.randomBytes(16).toString("hex");
            res.cookie(stateKey, state);

            // your application requests authorization
            let scope = "user-read-currently-playing";
        
            // whether the user must reauthorize upon every login
            let showDialog = true;
        
            //redirect to spotify authorization page
            res.redirect(
                auth_url +
                    querystring.stringify({
                        response_type: "code",
                        client_id: client_id,
                        scope: scope,
                        redirect_uri: redirect_uri,
                        state: state,
                        show_dialog: showDialog
                    })
            );
        });

        this.router.get("/callback", (req: Request , res: Response) => {
            //get authorization code contained in Spotify's callback request
            let code = req.query.code || null;
            let state = req.query.state || null;
            let storedState = req.cookies ? req.cookies[stateKey] : null;
            
            //check that state contained in Spotify's callback matches original request state
            //this prevents cross-site request forgery
            //if state doesn't match, redirect to error page
            if (state === null || state !== storedState) {
                res.redirect(
                    "/#" + querystring.stringify({ error: "state_mismatch" })
                );
            }
        
            //if state matches, continue on!
            else {
                //clear the state cookie
                res.clearCookie(stateKey);
                //use authorization code, client id and client secret to get access token and refresh token from Spotify
                //access token allows API request for a specific user's Spotify information.
                //refresh token allows API request to get a new access token once original expires.
                let body = {
                    code: code,
                    redirect_uri: redirect_uri,
                    grant_type: "authorization_code"
                };
                let headers = {
                    //authorization header is encoded in base64
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
                    json: true
                };
        
                axios.post(token_url, querystring.stringify(body), {headers: headers})
                    .then((response: AxiosResponse) => {
                        if (response.status == 200) {
                            let tokenInfo: refreshTokenResponseI = response.data;
                            let refresh_token = response.data.refresh_token;
            
                            fs.writeFile('./token.txt', refresh_token, err => {
                                if (err) { console.error("Error writing refresh_token to file: " + err); }
                            })

                            accessTokenCallback(tokenInfo);
                        
                            res.redirect("/panel");
                        } else {
                            res.redirect(
                                "/#" + querystring.stringify({ error: "invalid_token" })
                            );
                        }
                    })
                    .catch((err: AxiosError) => {
                        console.log(err);
                    });

                res.redirect("/panel");
            }
        });
    }

    static get(client_id: string, client_secret: string, accessTokenCallback: Function): Router {
        return new FlowRouter(client_id, client_secret, accessTokenCallback).router;
    }
}