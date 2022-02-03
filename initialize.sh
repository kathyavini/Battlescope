#!/bin/sh
trash ".eslintrc.json"
npm init -y
npm install webpack webpack-cli --save-dev
npm install --save-dev css-loader
npm install mini-css-extract-plugin --save-dev 
npm install css-minimizer-webpack-plugin --save-dev
mkdir dist src src/css

echo "const path = require('path');
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
          // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
          // `...`,
          new CssMinimizerPlugin(),
        ],
    },
};" >> "webpack.config.js"

echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Title</title>
    <link rel="stylesheet" href="./main.css">
    <script defer src="./main.js"></script>
</head>

<body>
</body>
</html>' >> dist/index.html

echo "// import './css/styles.css';
import { createNewElement } from './utils';" >> src/index.js

echo "export function createNewElement(
  type,
  classes = null,
  text = null,
  attributes = null
) {
  let createdElement = document.createElement(type);

  if (classes) {
    createdElement.classList.add(...classes);
  }

  if (text) {
    createdElement.textContent = text;
  }

  if (attributes) {
    for (let key in attributes) {
      createdElement.setAttribute(key, attributes[key]);
    }
  }

  return createdElement;
}" >> src/utils.js

# eslint
npm install eslint --save-dev
./node_modules/.bin/eslint --init

# jest
npm install jest --save-dev

# babel for jest imports
npm i -D @babel/preset-env 

echo "module.exports = {
    presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
  };" >> babel.config.js


# .gitignore file
echo ".eslintrc.json
dist/main.css
dist/main.js" >> .gitignore

#npx webpack --watch


