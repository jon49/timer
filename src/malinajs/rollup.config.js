import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import {derver} from 'derver/rollup-plugin';
import css from 'rollup-plugin-css-only';
import { terser } from "rollup-plugin-terser";
import malina from 'malinajs/malina-rollup'
import malinaSass from 'malinajs/plugins/sass'

const DEV = !!process.env.ROLLUP_WATCH;
const cssInJS = false;
// `npm run build` writes to ../../dist/malinajs; `npm run dev` serves public/.
const out = process.env.OUT || 'public';

export default {
    input: 'src/main.js',
    output: {
        file: `${out}/bundle.js`,
        format: 'iife',
    },
    plugins: [
        copy({
            targets: [
                { src: '../../static/*', dest: out },
                { src: './static/*', dest: out },
            ]
        }),
        malina({
            hideLabel: !DEV,
            css: cssInJS,
            plugins: [malinaSass()]
        }),
        resolve(),
        !cssInJS && css({ output: 'bundle.css' }),
        DEV && derver(),
        !DEV && !process.env.NO_MINIFY && terser()
    ],
    watch: {
        clearScreen: false
    }
}