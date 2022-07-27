import chroma from 'chroma-js';
// https://gka.github.io/chroma.js/#color-scales

/**
 * Generates a color palette
 * @param {string | chroma.Color} colors - colors to be used to generate the palette
 * @param {boolean} loop - If palette should be looped
 * @returns {chroma.Scale} A chroma scale palette
 */
export function generateColorPalette(colors : (string | chroma.Color)[], loop: boolean = true) : chroma.Scale {
    if (colors === undefined || colors === null) 
        throw new Error("No valid color provided");
    let lab_interpolation = false;
    let hues: number[] = [];

    if (colors.length > 1) {
        if (loop) {
            let loop_color: chroma.Color | string = colors[0];
            // make a looped color cycle
            if (loop_color !== colors[colors.length - 1]) {
                colors.push(loop_color);
            }
        }
        
        // collect the hues of the colors
        hues.map(color => { return chroma(color).hsl()[0] });
        
        // check if any color makes a near 180 degrees rotation in the hue wheel
        for (let i = 0; i < hues.length - 1; i++) {
            let diff: number = Math.abs(hues[i] - hues[i + 1]);
            if (Math.abs(diff - 180) < 20) {
                lab_interpolation = true;
                break;
            }
        }
    }
    return chroma.scale(colors).mode(lab_interpolation ? 'lab' : 'lrgb');
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
    if (color === undefined || color === null) return null;
    let c = chroma(color);
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
    let displacement: number = Math.round(time / tickrate);
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
    let new_index: number = shift(palette, index, time, tickrate);
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
 * @param {number} timeFactor - Factor from 0.0 to 1.0 from which the time will be consumed on the transition
 * @returns {string[]} Color transition array in hex format
 */
export function makeTimeTransitionOffset(palette: (string)[], color: string, index: number, time: number, tickrate: number = 33, timeFactor: number = 0.8) : string[] {
    if (tickrate <= 0) {
        tickrate = 5;
    }
    if (timeFactor <= 0 || timeFactor > 1) {
        timeFactor = 0.8;
    }
    let steps: number = Math.round((time * timeFactor) / tickrate);
    if (steps > palette.length) {
        steps = palette.length;
    }
    let new_index: number = (index + steps) % palette.length;
    let transition: string[] = generateColorPalette([color, palette[new_index]], false).colors(steps);

    // palette modification
    let prev: string[] = palette.splice(0, new_index + 1);

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
    let steps: number = Math.floor(chroma.distance(palette[index], color) / colorSteps);
    let new_index: number = (index + steps) % palette.length;
    let transition: string[] = generateColorPalette([color, palette[new_index]], false).colors(steps);

    // palette modification
    let prev: string[] = palette.splice(0, new_index + 1);
    palette.push(...prev);

    return transition;
}

// Aux function for debugging
export function pc(colors: (string)[], python_mode: boolean = false) : string {
    if (colors === undefined || colors === null) return null;
    for (let i = 0; i < colors.length; i++) {
        if (python_mode)
            console.log(`"${colors[i]}",`);
        else
            console.log(colors[i]);
    }
}

export function getDistribution(colors: (string)[]) {
    if (colors === undefined || colors === null) return null;
    for (let i = 0; i < colors.length - 1; i++) {
        console.log(chroma.distance(colors[i], colors[(i + 1)]));
    }
}

export function splitChroma(colors: string[], threshold: number = 23): { underThreshold: string[], overThreshold: string[] } {
    let ret_1: string[] = []
    let ret_2: string[] = []
    for (let i = 0; i < colors.length - 1; i++) {
        let chromaColor: chroma.Color = chroma(colors[i]);
        let a = {
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