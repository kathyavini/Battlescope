const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    devtool: 'inline-source-map',
    plugins: [new MiniCssExtractPlugin()],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',     
            },
        ],
    },
    optimization: {
        minimizer: [
          // For webpack@5 you can use the  syntax to extend existing minimizers (i.e. ), uncomment the next line
          // ,
          new CssMinimizerPlugin(),
        ],
    },
};
