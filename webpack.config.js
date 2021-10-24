// webpack.config.js
const path = require('path');
module.exports = {
  entry: './front.js',
  output: {
    filename: 'bundle.js'
  },
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.resolve(__dirname, "./dist"),
    },
    compress: true,
    port: 8080,
    open: true,
  },
};