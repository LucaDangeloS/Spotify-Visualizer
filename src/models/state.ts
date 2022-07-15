import { PaletteInfo, VisualizerInfo } from './visualizerInfo/visualizerInfo';
import { TrackInfo } from './spotifyApiInterfaces';
import { refreshTokenResponseI  } from '../spotifyIO/apiController';
import { savePalette, loadPalette } from './palette/paletteDAO';
import { palettesPath } from '../config/config.json';
import fs from "fs";
import SocketIO from 'socket.io';
import { generateHexColors } from 'src/visualizerService/visualizerFuncs';

export default class State {
    syncSocketRoom: string = "sync";
    trackInfo: TrackInfo = new TrackInfo();
    colorInfo: ColorInfo = new ColorInfo();
    visualizers: VisualizerInfo[] = [];
    globalDelay: number = 0;
    loops: Loops = new Loops();
    beatCallback: Function;
    verbose: boolean;
    active: boolean;
    headers = {};

    private _accessToken: string = null;
    private _expireTimestamp: Date = null;

    // Palette functions
    public loadPaletteFile(): void {
        let data = loadPalette();
        this.colorInfo.palettes = data.palettes
        this.colorInfo.defaultPalette = data.defaultPalette;
        this.colorInfo.paletteFile = JSON.parse(fs.readFileSync(palettesPath).toString())
    }

    public savePaletteFile(): void {
        savePalette({
            palettes: this.colorInfo.palettes, 
            defaultPalette: this.colorInfo.defaultPalette
        });
    }

    public addPalette(genColors: PaletteInfo) {
        this.colorInfo.palettes.push(genColors);
        this.savePaletteFile();
    }

    public removePalette(id: string) {
        let index = this.colorInfo.palettes.findIndex(p => p.id === id);
        if (index > -1) {
            this.colorInfo.palettes.splice(index, 1);
            this.savePaletteFile();
        }
    }

    // Visualizers functions
    public addVisualizer(visualizer: VisualizerInfo) {
        this.visualizers.push(visualizer);
    }

    public removeVisualizer(id: string) {
        let index = this.visualizers.findIndex(v => v.id === id);
        if (index > -1) {
            this.visualizers[index].socket.disconnect();
            this.visualizers.splice(index, 1);
        }
    }

    public clearVisualizers() {
        this.visualizers.forEach((v, index, arr) => {
            if (v.socket)
                v.socket.disconnect();
            arr.splice(index, 1);
        });
    }

    public syncVisualizers() {
        this.visualizers.forEach(v => {
            generateHexColors(v);
        });
    }

    public setAccessToken(accessToken: refreshTokenResponseI) {
        this._accessToken = accessToken.access_token;
        this._expireTimestamp = new Date(Date.now() + accessToken.expires_in * 1000);
        this.headers = { Authorization: "Bearer " + this._accessToken };
        if (this.verbose) {
            console.log("access token set " + this._accessToken);
            console.log("expire timestamp set " + this._expireTimestamp);
        }
    }
    public get accessToken(): string {
        return this._accessToken;
    }

    public get expireTimestamp(): Date {
        return this._expireTimestamp;
    }

    constructor(beatCallback: Function = () => {}, verbose: boolean = false) {
        this.verbose = verbose;
        this.active = true;
        this.beatCallback = beatCallback;
        this.loadPaletteFile();
    }

}

class Loops {
    beatLoop: ReturnType<typeof setTimeout> = null;
    trackProgressLoop: ReturnType<typeof setTimeout> = null;
}

class ColorInfo {
    palettes: Array<PaletteInfo> = [];
    defaultPalette: PaletteInfo = null;
    paletteFile = null;
}