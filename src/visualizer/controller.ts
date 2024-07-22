import { VisualizerInfo, VisualizerSocketInfo, VisualizerStateT } from "src/models/visualizerInfo/visualizerInfo";
import { generateColorPalette } from "src/models/palette/colors";
import { NoPaletteDefinedError, NullNameError, NullPaletteError, ValueOutOfBoundsError } from "./errors";
import { PaletteDAO } from "src/models/palette/paletteDAO";
import Synchronizer from "/spotify/synchronizer";

// TODO DEPRECATED
// export function generateScale(viz: VisualizerInfo): void {
//     if (viz.palette.info != null) {
//         const genColorsParsed = viz.palette.info.genColors;
//         viz.palette.scale = generateColorPalette(genColorsParsed, true);
//     } else {
//         throw new NoPaletteDefinedError(viz);
//     }
// }

export function generateHexColors(viz: VisualizerInfo, doubleColors: boolean = false): void {
    if (viz.palette.scale == null && viz.palette != null && viz.palette.info != null) {
        // Generate scale if not already generated
        const genColorsParsed = viz.palette.info.genColors;
        viz.palette.scale = generateColorPalette(genColorsParsed, true, viz.brightness, doubleColors);
    } else {
        throw new NoPaletteDefinedError(viz);
    }
    if (viz.palette.scale != null) {
        viz.palette.hexColors = viz.palette.scale.colors(viz.palette.size + viz.cycleModifier);
        // viz.palette.hexColors.forEach(element => {
        //     // console.log(`"${element}",`);
        //     console.log(element);
        // });
    } else {
        throw new NoPaletteDefinedError(viz);
    }
}