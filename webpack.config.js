const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  mode: "production",
  entry: "./index.js",
  target: "node",
  output: {
    filename: "webpack-bundle.js",
    path: path.resolve(path.resolve(), "build"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "eslint-loader",
      },
    ],
  },
  externals: nodeExternals(),
};
