import express = require('express');
import { Router, Request, Response } from 'express';
import cors = require("cors");
import cookieParser = require("cookie-parser");

export default class Server {
    public app : express.Application;

    constructor(private port: number, private client_id: string, private client_secret: string) {
        this.app = express()
            .use(FlowRouter.get())
            .use(express.static(__dirname + "/public"))
            .use(cors())
            .use(cookieParser());
    }

    start() {
        this.app.listen(this.port);
    }

    static init(port: number, client_id: string, client_secret: string): Server { 
        return new Server(port, client_id, client_secret);
    }
}

class FlowRouter {
    public router : Router;

    constructor() {
        this.router = Router();

        this.router.get("/", (req: Request, res: Response) => {
            res.sendFile(__dirname + "/public/index.html");
        });

        
    }

    static get() {
        return new FlowRouter().router;
    }
}