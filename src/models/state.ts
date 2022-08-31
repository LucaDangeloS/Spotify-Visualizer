import { VisualizerInfo } from './visualizerInfo/visualizerInfo';
import { TrackInfo } from './spotifyApiInterfaces';
import { refreshTokenResponseI  } from '../spotifyIO/apiController';
import { savePalette, loadPalettes, removePalette, PaletteDAO } from './palette/paletteDAO';
import { beatDelay, colorPaletteSize } from '../config/config.json';
import { colorTickRate } from '../config/defaultVisualizer.json';
import { generateColorPalette } from '../colors';
import { VisualizerServer } from 'src/visualizerService/sockets';


export default class State {
    sync: SyncSharedData = new SyncSharedData();
    trackInfo: TrackInfo = new TrackInfo();
    colorInfo: ColorInfo = new ColorInfo();
    visualizerServerSocket: VisualizerServer = null;
    visualizers: VisualizerInfo[] = [];
    globalDelay: number = beatDelay;
    loops: Loops = new Loops();
    beatCallback: Function;
    verbose: boolean;
    active: boolean;
    headers = {};

    private _accessToken: string = null;
    private _expireTimestamp: Date = null;

    // Palette functions
    public async loadPalettes(): Promise<boolean> {
        try {
            let data = await loadPalettes();
            this.colorInfo.palettes = data
            this.colorInfo.defaultPalette = data[0];
        } catch (err) {
            console.log(err);
            return false;
        }
        return true;
    }

    public async addPalette(palette: PaletteDAO): Promise<boolean> {
        try {
            this.colorInfo.palettes.push(palette);
            this.savePalette(palette);
        } catch (err) {
            console.log(err);
            return false;
        }
        return true;
    }

    private async savePalette(palette: PaletteDAO): Promise<boolean> {
        if (await savePalette(palette)) {
            return true;
        } else {
            return false;
        }
    }

    public async removePalette(id: string): Promise<boolean> {
        if (this.colorInfo.palettes.length === 1) {
            return false; // TODO: Raise exception
        }
        let ret = removePalette(id);
        if (ret) {
            await this.loadPalettes();
            return true;
        } else {
            return false; // TODO: Raise exception
        }
    }

    // Visualizers functions
    public addVisualizer(visualizer: VisualizerInfo) {
        this.visualizers.push(visualizer);
        if (this.sync.isSynced) {
            this.sync.tickrate = this.visualizers.reduce((acc, v) => acc + v.colorTickRate, 0) / this.visualizers.length;
        }
    }

    public removeVisualizer(id: string) {
        let index = this.visualizers.findIndex(v => v.id === id);
        if (index > -1) {
            this.visualizers[index].socket.disconnect();
            this.visualizers.splice(index, 1);
            if (this.sync.isSynced) {
                if (this.visualizers.length > 0) {
                    this.sync.tickrate = this.visualizers.reduce((acc, v) => acc + v.colorTickRate, 0) / this.visualizers.length;
                }
                else {
                    this.sync.tickrate = colorTickRate;
                }
            }
        }
    }

    public clearVisualizers() {
        this.visualizers.forEach((v, index, arr) => {
            if (v.socket)
                v.socket.disconnect();
            arr.splice(index, 1);
        });
    }

    // sync
    public syncVisualizers() {
        this.sync.isSynced = true;
        this.sync.colorArray = generateColorPalette(this.colorInfo.defaultPalette.genColors, true).colors(colorPaletteSize);
        // calculate mean of visualizer delays
        this.sync.tickrate = this.visualizers.reduce((acc, v) => acc + v.colorTickRate, 0) / this.visualizers.length;
    }

    // TODO: desync
    public desyncVisualizers() {
        this.sync.isSynced = false;
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
        this.loadPalettes();
    }

}

class Loops {
    beatLoop: ReturnType<typeof setTimeout> = null;
    trackProgressLoop: ReturnType<typeof setTimeout> = null;
}

class ColorInfo {
    palettes: Array<PaletteDAO> = [];
    defaultPalette: PaletteDAO = null;
}

class SyncSharedData {
    isSynced: boolean = false;
    syncSocketRoom: string = "sync";
    colorArray: string[] = null;
    lastBeatTimestamp: number = Date.now();
    tickrate: number = colorTickRate;
}