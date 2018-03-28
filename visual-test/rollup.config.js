'use strict'

const path = require('path')
const babel = require('rollup-plugin-babel')
const resolve = require('rollup-plugin-node-resolve')

const fileDest = 'unitTest-built.js'
const fileSrc = 'unitTest.js'

const plugins = [
    babel({
        exclude: 'node_modules/**', // Only transpile our source code
        externalHelpersWhitelist: [ // Include only required helpers
            'defineProperties',
            'createClass',
            'inheritsLoose',
            'extends'
        ]
    })
    , resolve() // bundle
]

module.exports = {
    input: path.resolve(__dirname, fileSrc),
    output: {
        file: path.resolve(__dirname, fileDest),
        format: 'umd',
        name: 'spa'
    },
    plugins
}
