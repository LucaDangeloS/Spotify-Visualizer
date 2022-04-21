import chroma from 'chroma-js';
// https://gka.github.io/chroma.js/#color-scales

export function generateColorPalette(colors : (string | chroma.Color)[]) : chroma.Scale {
    if (colors === undefined || colors === null) return null;
    let lab_interpolation = false;
    let hues: number[] = [];

    if (colors.length > 1) {
        let loop_color: chroma.Color | string = colors[0];
        // make a looped color cycle
        if (loop_color !== colors[colors.length - 1]) {
            colors.push(loop_color);
        }
        
        // collect the hues of the colors
        colors.forEach(color => { hues.push(chroma(color).hsl()[0]); });

        // check if any color makes a near 180 degrees rotation in the hue wheel
        for (let i = 0; i < hues.length - 1; i++) {
            let diff: number = Math.abs(hues[i] - hues[i + 1]);

            if (Math.abs(diff - 180) < 10) {
                lab_interpolation = true;
                break;
            }
        }
    }

    return chroma.scale(colors).mode(lab_interpolation ? 'lab' : 'lrgb');
}

export function complementary(color: (string | chroma.Color | number)) : string {
    return chroma(color).set('hsl.h', 180).hex();
}

export function analogous(color: (string | chroma.Color | number), a: number) : string {
    return chroma(color).set('hsl.h', a).hex();
}

// TODO Create a function that given a time and tickrate, shifts the color palette

// TODO Create a function that returns the nearest entry point on the color cycle given a color

// TODO Create a function that returns color sequence based on time and tickrate

// Aux function for debugging
export function pc(colors: (string)[]) {
    for (let i = 0; i < colors.length; i++) {
        console.log(colors[i]);
    }
}
