import { Router, Request, Response } from "express";
import State from "/models/state";

// Server should have State and Synchronizer
export default class RestApi {
    public router : Router;

    constructor(state: State) {
        this.router = Router();
        this.router.get("/config", (req: Request, res: Response) => {
            let data = {

            }

            res.send(data);
        });
    }

    static get(state: State): Router {
        return new RestApi(state).router;
    }
}