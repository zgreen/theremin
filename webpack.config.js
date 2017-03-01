'use strict'

var path = require('path')
var webpack = require('webpack')
var postcss = require('postcss')
var postcssCalc = require('postcss-calc')
var postcssImport = require('postcss-import')
var postcssNested = require('postcss-nested')
var isHot = process.argv.indexOf('--hot') !== -1

module.exports = {
  entry: {
    app: 'src/app.js'
  },
  output: {
    path: 'build',
    publicPath: !isHot ? '/theremin/build/' : 'http://localhost:8080/build/',
    filename: '[name].bundle.js'
  },
  resolve: {
    root: path.resolve(__dirname),
    modulesDirectories: [
      'node_modules'
    ]
  },
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint'
      },
      {
        test: /\.jsx$/,
        loader: 'nativejsx',
        excludes: /node_modules/,
      }
    ],
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
			{
        test: /\.css$/,
        loader: 'style!css?modules&localIdentName=[name]__[local]__[hash:base64:5]!postcss'
      },
			{
        test: /\.json$/,
        loader: 'json'
      },
      {
        test: /\.html$/,
        loader: 'dom!html?interpolate'
      },
      {
        test: /\.pug$/,
        loader: 'pug'
      },
      {
        test: /\.vue$/,
        loader: 'vue'
      }
    ]
  },
  postcss: function (webpack) {
    return [
      postcssImport({addDependencyTo: webpack}),
      postcssNested,
      postcssCalc
    ]
  }
}
