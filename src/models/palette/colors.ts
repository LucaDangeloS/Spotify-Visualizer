import chroma from 'chroma-js';
// https://gka.github.io/chroma.js/#color-scales

/**
 * Generates a color palette
 * @param {string | chroma.Color} colors - colors to be used to generate the palette
 * @param {boolean} loop - If palette should be looped
 * @returns {chroma.Scale} A chroma scale palette
 */
export function generateColorPalette(colors : (string | chroma.Color)[], loop: boolean = true, brightness: number = 1, doubleColors: boolean = false) : chroma.Scale {
    if (colors === undefined || colors === null) {
        throw new Error("No valid color provided");
    }
    let use_lab = false;
    const hues: number[] = [];

    if (colors.length > 1) {
        if (loop) {
            const loop_color: chroma.Color | string = colors[0];
            // make a looped color cycle
            if (loop_color !== colors[colors.length - 1]) {
                colors.push(loop_color);
            }
        }
        
        // collect the hues of the colors
        hues.map(color => { return chroma(color).hsl()[0] });
        
        // check if any color makes a near 180 degrees rotation in the hue wheel
        for (let i = 0; i < hues.length - 1; i++) {
            const diff: number = Math.abs(hues[i] - hues[i + 1]);
            if (Math.abs(diff - 180) < 30) {
                use_lab = true;
                break;
            }
        }
        // process the colors in pairs ?
        // for (let i = 0; i < colors.length - 1; i = i + 2) {
        // }
    }
    // scale the colors to the desired brightness
    const colorBrightness: number = chroma(colors[0]).hsl()[2];
    if (brightness !== 1) {
        colors = colors.map(color => {
            const c = chroma(color);
            const hsl = c.hsl();
            hsl[2] = colorBrightness * brightness;
            return chroma.hsl(...hsl);
        });
    }

    if (doubleColors) {
        let tmpColors = [];
        for (let i = 0; i < colors.length; i++) {
            tmpColors.push(colors[i]);
            tmpColors.push(colors[i]);
        }
        colors = tmpColors;
    }

    return chroma.scale(colors).mode(use_lab ? 'lab' : 'lrgb');
}

/**
 * Generate the complementary color in hex of a given color
 * @param {string | chroma.Color | number} color 
 * @returns {string} Complementary color
 */
export function complementary(color: (string | chroma.Color | number)) : string {
    if (color === undefined || color === null) return null;
    return chroma(color).set('hsl.h', '+180').hex();
}

/**
 * Generate 2 analogous colors (left and right) in hex for a given color
 * @param {string | chroma.Color | number} color 
 * @param {number} a - Angle 
 * @returns {left: string, right: string} Analogous colors
 */
export function analogous(color: (string | chroma.Color | number), a: number) : {left: string, right: string} {
    if (color === undefined || color === null) throw new Error("No valid color provided");
    const c = chroma(color);
    return {left: c.set('hsl.h', `-${a}`).hex(), right: c.set('hsl.h', `+${a}`).hex()};
}



/**
 * Testing function.
 * Given a time and tickrate, shifts the color palette
 * @param {string[]} palette 
 * @param {number} index 
 * @param {number} time (in ms)
 * @param {number} tickrate 
 * @returns {number} index
 */
export function shift(palette: (string)[], index: number, time: number, tickrate: number = 33) : number {
    if (palette === undefined || palette === null) return null;
    const displacement: number = Math.round(time / tickrate);
    return (index + displacement) % palette.length;
}

/**
 * Testing function.
 * Returns a color sequence based on time and tickrate
 * @param {string[]} palette 
 * @param {number} index 
 * @param {number} time (in ms)
 * @param {number} tickrate 
 * @returns {rotation: string[], idx: number} rotation color array and index
 * */ 
export function sequence(palette: (string)[], index: number, time: number, tickrate: number = 33) : {rotation: string[], idx: number} {
    if (palette === undefined || palette === null) return null;
    const new_index: number = shift(palette, index, time, tickrate);
    return {rotation: palette.slice(index, new_index), idx: new_index};
}


/**
 * Given a palette and a color, offsets the palette and gives the color rotation for a smooth entry point at the index 0 of the palette,
 * taking time (in ms) * timeFactor for the transition to complete.
 * @param {string[]} palette - The color palette in hex format
 * @param {string} color - Color from which to rotate
 * @param {number} index - Current index at the palette
 * @param {number} time - Time (in ms) that the transition will take
 * @param {number} tickrate - Time at which the time ticks
 * @param {number} timeRatio - Ratio from 0.0 to 1.0 from which the time will be consumed on the transition
 * @returns {string[]} Color transition array in hex format
 */
export function makeTimeTransitionOffset(palette: (string)[], color: string, index: number, time: number, tickrate: number = 33, timeRatio: number = 0.8) : string[] {
    if (tickrate <= 0) {
        tickrate = 33;
    }
    if (timeRatio <= 0 || timeRatio > 1) {
        timeRatio = 0.8;
    }
    let steps: number = Math.round((time * timeRatio) / tickrate);
    if (steps > palette.length) {
        steps = palette.length;
    }
    const new_index: number = (index + steps) % palette.length;
    const transition: string[] = generateColorPalette([color, palette[new_index]], false).colors(steps);

    // palette modification
    const prev: string[] = palette.splice(0, new_index + 1);

    palette.push(...prev);

    return transition;
}

/**
 * Given a palette and a color, offsets the palette and gives the color rotation for a smooth entry point at the index 0 of the palette,
 * taking n steps based on the distance of the colors.
 * @param {string[]} palette - The color palette in hex format
 * @param {string} color - Color from which to rotate
 * @param {number} index - Current index at the palette
 * @param {number} colorSteps - Number of steps to take in the transition 
 * @returns {string[]} Color transition array in hex format
 */
export function makeDistanceTransitionOffset(palette: (string)[], color: string, index: number, colorSteps: number = null): string[] {
    if (colorSteps === null || colorSteps <= 0){
        colorSteps = Math.round(chroma.distance(palette[index], palette[(index + 1) % palette.length]));
    }
    const steps: number = Math.floor(chroma.distance(palette[index], color) / colorSteps);
    const new_index: number = (index + steps) % palette.length;
    const transition: string[] = generateColorPalette([color, palette[new_index]], false).colors(steps);

    // palette modification
    const prev: string[] = palette.splice(0, new_index + 1);
    palette.push(...prev);

    return transition;
}

// Aux function for debugging: prints the palette in python format
export function pc(colors: (string)[], python_mode: boolean = false) : string {
    if (colors === undefined || colors === null) return null;
    for (let i = 0; i < colors.length; i++) {
        if (python_mode)
            console.log(`"${colors[i]}",`);
        else
            console.log(colors[i]);
    }
}

// Aux function for debugging: prints the distance between each adjacent color in the palette
export function getDistribution(colors: (string)[]): number[] {
    if (colors === undefined || colors === null) return null;
    const distances = [];
    for (let i = 0; i < colors.length - 1; i++) {
        distances.push(chroma.distance(colors[i], colors[(i + 1)]));
    }
    return distances;
}

// Aux function for debugging: Splits the palette in two based on a chroma threshold to detect 
export function splitChroma(colors: string[], threshold: number = 23): { underThreshold: string[], overThreshold: string[] } {
    const ret_1: string[] = []
    const ret_2: string[] = []
    for (let i = 0; i < colors.length - 1; i++) {
        const  chromaColor: chroma.Color = chroma(colors[i]);
        const a = {
            color: chromaColor.hex(),
            chroma: chromaColor.hcl()[1],
        };
        if (a.chroma < threshold) {
            ret_1.push(a.color);
        } else {
            ret_2.push(a.color);
        }
    }
    return { underThreshold: ret_1, overThreshold: ret_2 };
}