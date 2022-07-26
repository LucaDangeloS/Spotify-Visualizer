import { VisualizerInfo } from './visualizerInfo/visualizerInfo';
import { TrackInfo } from './spotifyApiInterfaces';
import { refreshTokenResponseI  } from '../spotifyIO/apiController';
import { savePalette, loadPalettes, removePalette, PaletteDAO } from './palette/paletteDAO';
import { generateHexColors } from '../visualizerService/visualizerFuncs';

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
        let ret = removePalette(id);
        if (ret) {
            await this.loadPalettes();
            return true;
        } else {
            return false;
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
    paletteFile = null;
}