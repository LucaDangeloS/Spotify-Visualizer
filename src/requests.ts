import express, { Router, Request, Response } from'express';
import cors = require("cors");
import crypto = require('crypto');
import cookieParser = require("cookie-parser");
import querystring = require("query-string");
import { baseUrl, frontEndPort } from "./config/network-info.json";
import fs, { readFileSync } from "fs";
import State from "./state";
import axios from "axios";


export default class Server {
    public app : express.Application;
    private _accessToken: string;
    private _expireTimestamp: Date;
    private verbose: boolean = false;

    constructor(private port: number, private client_id: string, private client_secret: string, private state: State, verbose?: boolean) {
        this.verbose = verbose;
        this.app = express()
            .use(cookieParser())
            .use(cors())
            .use(FlowRouter.get(client_id, client_secret, (token: any) => {this.readTokenResponse = token}))
            .use(express.static(__dirname + "/public"));
    }

    start() {
        this.app.listen(this.port, () => {if (this.verbose) console.log("Server started on port " + this.port)});
    }

    static init(port: number, client_id: string, client_secret: string, state: State, verbose?: boolean): Server { 
        return new Server(port, client_id, client_secret, state, verbose);
    }

    // Setters
    private set accessToken(access_token: string) {
        this._accessToken = access_token;
        if (this.verbose)
            console.log("access token set " + this._accessToken);
    }
    
    private set expireTimestamp(expire_timestamp: Date) {
        this._expireTimestamp = expire_timestamp;
        if (this.verbose)
            console.log("expire timestamp set " + this._expireTimestamp);
    }

    public set readTokenResponse(res: { access_token: string; expires_in: number; }){
        this.accessToken = res.access_token;
        this.expireTimestamp = new Date(Date.now() + res.expires_in * 1000);
    }

    // Public methods
    public refreshToken() {
        const refresh_token = readFileSync('./token.txt', 'utf-8');
        const refresh_url = "https://accounts.spotify.com/api/token";
        const refresh_body = {
            grant_type: "refresh_token",
            refresh_token: refresh_token,
        };
        const headers = {
            headers: {
                Authorization: `Basic ${Buffer.from(this.client_id + ":" + this.client_secret).toString('base64')}`,
                ContentType: "application/x-www-form-urlencoded"
            }
        };
        axios.post(refresh_url, serialize(refresh_body), headers)
            .then(res => {
                this._accessToken = res.data.access_token;
            })
            .catch(err => {
                console.log(err);
            })
    }
}

function serialize(obj) {
    let str = [];
    for (let p in obj)
    if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
    return str.join("&");
}

class FlowRouter {
    public router : Router;
    private auth_url: string = "https://accounts.spotify.com/authorize?";
    private token_url: string = "https://accounts.spotify.com/api/token";
    // protected stateKey: string = "spotify_auth_state";
    // protected redirect_uri: string =  `${baseUrl}:${frontEndPort}/callback`;

    constructor(client_id: string, client_secret: string, accessTokenCallback: Function) {
        this.router = Router();
        const stateKey = "spotify_auth_state";
        const redirect_uri: string =  `${baseUrl}:${frontEndPort}/callback`;

        this.router.get("/", (req: Request, res: Response) => {
            res.sendFile(__dirname + "/public/index.html");
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
                this.auth_url +
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
                    "/#" +
                        querystring.stringify({
                            error: "state_mismatch"
                        })
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
        
                axios.post(this.token_url, serialize(body), {headers: headers})
                    .then(response => {
                        if (response.status == 200) {
                            let access_token = response.data.access_token;
                            let refresh_token = response.data.refresh_token;
            
                            fs.writeFile('./token.txt', refresh_token, err => {
                                if (err) { console.error("Error writing refresh_token to file: " + err); }
                            })

                            accessTokenCallback(response.data);
                        
                            res.redirect("/placeholder");
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    })

                return;
                //send http request to Spotify to get access token and refresh token
                // request.post(authOptions, (error, response, body) => {
                //     if (!error && response.statusCode === 200) {
                //         //grab access token and refresh token from API response
                //         let access_token = body.access_token;
                //         let refresh_token = body.refresh_token;
        
                //         fs.writeFile('./token.txt', refresh_token, err => {
                //             if (err) { console.error("Error writing refresh_token to file: " + err); }
                //         })
        
                //         //ONCE ACCESS TOKEN IS PASSED TO BACK-END,
                //         //VISUALIZATION MAY BEGIN
        
                //         //pass access token to back-end server
                //         // this.state.backendSocket.emit("accessToken", access_token);
                //         accessTokenCallback(body);
        
                //         //redirect to main interface page
                //         res.redirect("/placeholder");
                //     }
        
                //     //if authorization code is rejected, redirect with invalid token error
                //     else {
                //         res.redirect(
                //             "/#" +
                //                 querystring.stringify({
                //                     error: "invalid_token"
                //                 })
                //         );
                //     }
                // });
            }
        });
    }

    static get(client_id: string, client_secret: string, accessTokenCallback: Function): Router {
        return new FlowRouter(client_id, client_secret, accessTokenCallback).router;
    }
}

