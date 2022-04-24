import chroma from 'chroma-js';
import * as colors from '../colors';

describe('Color palette manipulation', function() {
    let test_colorset = ["red", "purple", "blue", "cyan", "green", "orange", "red"]
    let test_colorset_2 = ["purple", "darkred", "darkblue", "red"]

    let palette_1: chroma.Scale;
    let palette_2: chroma.Scale;
    
    test('Palette creation', () => {
        palette_1 = colors.generateColorPalette(test_colorset);
        palette_2 = colors.generateColorPalette(test_colorset_2);
        expect(palette_1(0)).toEqual(chroma("red"));
        expect(palette_1(0.5)).toEqual(chroma("cyan"));
        expect(palette_1(1)).toEqual(chroma("red"));

        expect(palette_2(0)).toEqual(chroma("purple"));
        expect(palette_2(0.25)).toEqual(chroma("darkred"));
        expect(palette_2(0.5)).toEqual(chroma("darkblue"));
        expect(palette_2(0.75)).toEqual(chroma("red"));
        expect(palette_2(1)).toEqual(chroma("purple"));

        // Used lab interpolation to avoid grayish colors
        expect(colors.splitChroma(palette_1.colors(30), 23).underThreshold.length).toEqual(0);
        expect(colors.splitChroma(palette_2.colors(30), 23).underThreshold.length).toEqual(0);
    });

    test('Complementary color', () => {
        expect(colors.complementary(chroma("red"))).toEqual(chroma("cyan").hex());
        expect(colors.complementary(chroma("cyan"))).toEqual(chroma("red").hex());
        expect(colors.complementary(chroma("blue"))).toEqual(chroma("yellow").hex());
        expect(colors.complementary(chroma("purple"))).toEqual(chroma("green").hex());
        expect(colors.complementary(chroma("green"))).toEqual(chroma("purple").hex());
    });

    test('Analogous color', () => {
        expect(colors.analogous(chroma("red"), 60).right).toEqual(chroma("yellow").hex());
        expect(colors.analogous(chroma("red"), 60).left).toEqual(chroma("magenta").hex());
        expect(colors.analogous(chroma("blue"), 60).right).toEqual(chroma("magenta").hex());
        expect(colors.analogous(chroma("blue"), 60).left).toEqual(chroma("cyan").hex());
        expect(colors.analogous(chroma("green"), 60).right).toEqual(chroma("teal").hex());
        expect(colors.analogous(chroma("green"), 60).left).toEqual(chroma("olive").hex());
        expect(colors.analogous(chroma("yellow"), 120).right).toEqual(chroma("cyan").hex());
    });

    test('Sequence/Shift', function () {
        palette_1 = colors.generateColorPalette(test_colorset);
        let colorPalette: string[] = palette_1.colors(60);
        let tickrate: number = 5;

        let t1: number = 270;
        let t2: number = 450;
        let t3: number = 647;

        let idx1: number = 0;
        let idx2: number = 40;
        let idx3: number = 37;

        let new_idx1: number;
        let new_idx2: number;
        let new_idx3: number;

        expect(new_idx1 = colors.shift(colorPalette, idx1, t1, tickrate)).toEqual((idx1 + Math.round(t1 / tickrate)) % colorPalette.length);
        expect(new_idx2 = colors.shift(colorPalette, idx2, t2, tickrate)).toEqual((idx2 + Math.round(t2 / tickrate)) % colorPalette.length);
        expect(new_idx3 = colors.shift(colorPalette, idx3, t3, tickrate)).toEqual((idx3 + Math.round(t3 / tickrate)) % colorPalette.length);
        
        let c1 = colorPalette.slice(idx1, new_idx1);
        let c2 = colorPalette.slice(idx2, new_idx2);
        let c3 = colorPalette.slice(idx3, new_idx3);
        
        expect(colors.sequence(colorPalette, idx1, t1, tickrate).rotation).toEqual(c1);
        expect(colors.sequence(colorPalette, idx2, t2, tickrate).rotation).toEqual(c2);
        expect(colors.sequence(colorPalette, idx3, t3, tickrate).rotation).toEqual(c3);
    });
    
    test('Time-based Transition', () => {
        palette_1 = colors.generateColorPalette(test_colorset);
        let colorPalette: string[] = palette_1.colors(60);
        let tickrate: number = 5;
        let t: number = 300;
        let idx: number = 0;
        let factor = 0.6;
        let offset: number = Math.round((t * factor) / tickrate) % colorPalette.length;
        let splitColor = colors.complementary(colorPalette[idx]);
        let offsetColor = colorPalette[idx + offset + 1]

        expect(colors.makeTimeTransitionOffset(colorPalette, splitColor, idx, t, tickrate, factor).length).toEqual(offset);
        expect(colorPalette[0]).toEqual(offsetColor);
    });

    test('Color distance-based Transition', () => {
        palette_1 = colors.generateColorPalette(test_colorset);
        let colorPalette: string[] = palette_1.colors(50);
        let idx: number = 0;
        let splitColor = colors.analogous(colorPalette[idx], 30).right;
        let offsetColor = colorPalette[idx + 1]

        let transition = colors.makeDistanceTransitionOffset(colorPalette, splitColor, idx, 180);
        expect(transition.length).toBeLessThanOrEqual(2);
        expect(colorPalette[0]).toEqual(offsetColor);
        
        transition = colors.makeDistanceTransitionOffset(colorPalette, splitColor, idx, 5);

        expect(transition.length).toBeGreaterThan(5);
        expect(transition[transition.length - 1]).toEqual(colorPalette[colorPalette.length - 1]);
    });


    test('Exhaustive Time Shift', () => {
        let c = colors.generateColorPalette(["purple", "darkred", "darkblue", "red"]);
        let cs: string[] = c.colors(50);
        let idx = Math.random();
        let idxW = Math.round(idx * cs.length);
        let shiftedColor: string = colors.complementary(c(idx));
        let interpolation;

        for (let i = 0; i < 3000; i++) {
            interpolation = colors.makeTimeTransitionOffset(cs, shiftedColor, idxW, i, 5);
        }
    });

    test('Exhaustive Distance Shift', () => {
        let c = colors.generateColorPalette(["purple", "darkred", "darkblue", "red"]);
        let cs: string[] = c.colors(50);
        let idx = Math.random();
        let idxW = Math.round(idx * cs.length);
        let shiftedColor: string = colors.complementary(c(idx));
        let interpolation;

        for (let i = 0; i < 900; i++) {
            interpolation = colors.makeDistanceTransitionOffset(cs, shiftedColor, idxW, i);
        }
    });
});