/* eslint-env node */
"use strict"

const ENVIRONMENT = process.env.NODE_ENV || "development"
const {resolve} = require("path")
const {description, version} = require("./package.json")
const routes = require("./routes.json")
const appRoute = routes.app[ENVIRONMENT]
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const marked = require("marked")
const autoprefixer = require("autoprefixer")
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const extractCSS = new ExtractTextPlugin("site.css")

const exclude = /node_modules/

const renderer = new marked.Renderer()
const $ = module.exports = {}

$.devtool = "source-map"

$.entry = {
  site: "./app/index.js"
}

$.output = {
  path: __dirname + "/site-deploy",
  filename: "[name].js",
  sourceMapFilename: "[name].map"
}

$.plugins = [
  new webpack.NoErrorsPlugin(),
  new webpack.LoaderOptionsPlugin({
    options: {
      markdownLoader: {renderer},
      postcss: {
        plugins: [autoprefixer({remove: false, browsers: ["last 2 versions", "ie 10"]})]
      }
    }
  }),
  new webpack.DefinePlugin({
    "process.env.NODE_ENV": JSON.stringify(ENVIRONMENT)
  }),
  extractCSS,
  new HtmlWebpackPlugin({
    title: "Typical Design",
    description,
    template: "app/index.pug"
  }),
  new CopyWebpackPlugin([
    {from: "./app/external-assets", to: "external-assets"}
  ], {
    ignore: [".DS_Store"]
  })
]

$.resolve = {
  extensions: [".js", ".json"],
  modules: [resolve(__dirname, "app"), "node_modules"]
}

const minimizeParam = ENVIRONMENT === "development" ? "-minimize" : "minimize"
const commonCSSLoaderList = `css?${minimizeParam}!postcss!stylus?paths=app`

$.module = {
  noParse: /\.min\.js/,
  loaders: [
    {test: /\.pug$/, loader: "pug", exclude},
    {test: /\.ico|png|jpe?g|gif$/i, loader: "url?limit=0", exclude},
    {test: /\.js$/, loader: "eslint", enforce: "pre", exclude},
    {test: /\.js$/, loader: "babel", exclude},
    {test: /\.svg$/, loader: "svg-inline", exclude},
    {
      test: /\.styl$/,
      loader: ExtractTextPlugin.extract({
        fallbackLoader: "style",
        loader: commonCSSLoaderList
      })
    }
  ]
}

if (ENVIRONMENT === "development") {
  $.devtool = "eval"

  const devServerClient = `webpack-dev-server/client?http://0.0.0.0:${appRoute.port}`

  if (Array.isArray($.entry)) {
    $.entry.unshift(devServerClient)
  }
  else {
    $.entry["dev-server-client"] = devServerClient
  }
}
