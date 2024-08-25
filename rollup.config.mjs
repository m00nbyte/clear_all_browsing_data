// modules
import clean from '@rollup-extras/plugin-clean';
import progress from 'rollup-plugin-progress';
import tsConfigPaths from 'rollup-plugin-tsconfig-paths';
import typescript from 'rollup-plugin-typescript2';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import copy from 'rollup-plugin-copy-assets';
import strip from '@rollup/plugin-strip';
import stripCode from 'rollup-plugin-strip-code';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';

// local
import { createRequire } from 'module';
const pkg = createRequire(import.meta.url)('./package.json');

// prod build
const production = process.env.NODE_ENV === 'production';

export default {
    input: 'src/background.ts',
    output: {
        dir: 'dist',
        format: 'es'
    },
    plugins: [
        progress({
            clearLine: true
        }),
        clean({
            targets: ['./dist', './stats'],
            deleteOnce: true
        }),
        ...((production && [
            stripCode({
                start_comment: 'NO_PRODUCTION_START',
                end_comment: 'NO_PRODUCTION_END'
            })
        ]) ||
            []),
        tsConfigPaths(),
        typescript({ useTsconfigDeclarationDir: true }),
        dynamicImportVars(),
        commonjs(),
        babel({
            babelHelpers: 'bundled',
            exclude: 'node_modules/**'
        }),
        ...((production && [
            strip({
                debugger: true,
                sourceMap: true,
                functions: ['assert.*']
            }),
            replace({
                preventAssignment: true,
                ...[
                    { key: 'NODE_ENV', value: 'production' },
                    { key: 'MODULE_NAME', value: pkg.name },
                    { key: 'MODULE_VERSION', value: pkg.version }
                ].reduce((obj, { key, value }) => ({ ...obj, [`process.env.${key}`]: JSON.stringify(value) }), {})
            }),
            terser({
                toplevel: false,
                compress: {
                    passes: 4
                },
                output: {
                    ascii_only: true,
                    preamble: [
                        '/*',
                        `    Ⓒ __copyright __company\n`,
                        '    package:  __projectName',
                        '    version:  __buildVersion',
                        '    date:     __buildDate',
                        '*/'
                    ].join('\n')
                }
            }),
            replace({
                preventAssignment: true,
                __copyright: new Date().getFullYear(),
                __company: pkg.author.split(' ')[0],
                __projectName: pkg.name,
                __buildVersion: pkg.version,
                __buildDate: () => new Date().toUTCString()
            })
        ]) || [
            replace({
                preventAssignment: true,
                __buildVersion: `${pkg.version}-dev`
            })
        ]),
        copy({
            assets: ['manifest.json', 'icons']
        })
    ]
};
