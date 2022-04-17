import { baseUrl, frontEndPort, auth_url, token_url } from "./config/network-info.json";
import fs, { readFileSync } from "fs";
import State from "./state";
import axios from "axios";
import { serialize } from "./utils";


export default interface APIFetcherI {
    set readTokenResponse(token: { access_token: string; expires_in: number; });
    refreshToken(): void;
}

// Spotify API Fetcher
export class APIFetcher implements APIFetcherI {
    private _accessToken: string;
    private _expireTimestamp: Date;
    private verbose: boolean = false;
    
    constructor(private client_id: string, private client_secret: string, private state: State, verbose?: boolean) {
        this.verbose = verbose;
        this.client_id = client_id;
        this.client_secret = client_secret;
        this.state = state;
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
        let refresh_token = readFileSync('./token.txt', 'utf-8');
        let refresh_url = auth_url;
        let refresh_body = {
            grant_type: "refresh_token",
            refresh_token: refresh_token,
        };
        let headers = {
            headers: {
                Authorization: `Basic ${Buffer.from(this.client_id + ":" + this.client_secret).toString('base64')}`,
                "Content-Type": "application/x-www-form-urlencoded"
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