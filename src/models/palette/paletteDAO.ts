import { PaletteInfo } from '../visualizerInfo/visualizerInfo';
import { palettesPath } from '../../config/config.json';
import fs from "fs";

// For now it's just saved on a json file

export interface paletteObject {
    palettes: PaletteInfo[],
    defaultPalette: PaletteInfo
}

export function savePalette(paletteObject: paletteObject): void {
    let jsonObj = {
        palettes: paletteObject.palettes,
        default: paletteObject.defaultPalette
    }
    fs.writeFileSync(palettesPath, JSON.stringify(jsonObj));
}

export function loadPalette(): paletteObject {
    try {
        let info = JSON.parse(fs.readFileSync(palettesPath).toString());
        return {
            palettes: info.palettes,
            defaultPalette: info.default
        }
    } catch (e) { // IO exception
        console.error(e);
    }
}