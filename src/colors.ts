import chroma from 'chroma-js';
// https://gka.github.io/chroma.js/#color-scales

function generateColorPalette(colors : []) : chroma.Scale {
    // let hues = chroma(colors)
    return chroma.scale(...colors);
}

function complementary(color) : string {
    return chroma(color).set('hsl.h', 180).hex();
}

function analogous(color, a) : string {
    return chroma(color).set('hsl.h', a).hex();
}