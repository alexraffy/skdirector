
const webpack = require('webpack');

const path = require('path');

module.exports = {
    mode: "production",
    entry: './build/main.js',
    output: {
        filename: 'SKDirector.min.js',
        path: path.resolve(__dirname, 'dist'),
    },
    externals: {
        "os": "os",
        "fs": "fs",
        "path": "path",
        "restify": "restify",
        "morgan": "morgan",
        "cross-spawn": "cross-spawn",
    },
    externalsType: 'node-commonjs',
    optimization: {
        minimize: false
    },

};