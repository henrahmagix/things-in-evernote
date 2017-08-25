const path = require('path');
const webpack = require('webpack');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PATHS = {
    SRC: 'src',
    DEV: 'build',
    DIST: 'dist',
};

const IN_PRODUCTION = process.env.NODE_ENV === 'production';
const IN_DEVELOPMENT = !IN_PRODUCTION;

const ENV_DIR = IN_PRODUCTION ? PATHS.DIST : PATHS.DEV;

const getDirPath = function (dest) {
    return path.resolve(__dirname, dest);
};

const getWebPath = function (dest) {
    return getDirPath(path.join(PATHS.SRC, dest));
};

const getOutputPath = function () {
    return getDirPath(ENV_DIR);
};

const plugins = {
    clean: new CleanWebpackPlugin(
        [
            getOutputPath(),
        ],
        {
            verbose: true,
            watch: true,
            dry: false,
        }
    ),
    sass: new ExtractTextPlugin({
        filename: '[name].css',
        disable: IN_DEVELOPMENT,
    }),
    html: new HtmlWebpackPlugin({
        template: '!!handlebars-loader!src/index.hbs',
        inject: 'body',
        hash: true,
    }),
};

if (IN_DEVELOPMENT) {
    plugins.namedModules = new webpack.NamedModulesPlugin();
}

module.exports = {
    entry: {
        'js/app': getWebPath('js/index.js'),
    },
    output: {
        path: getOutputPath(),
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.hbs$/,
                loader: 'handlebars-loader',
            },
            {
                test: /\.sass$/,
                use: plugins.sass.extract({
                    use: [
                        {
                            loader: 'css-loader',
                            options: {sourceMap: true},
                        },
                        {
                            loader: 'sass-loader',
                            options: {sourceMap: true},
                        },
                    ],
                    fallback: 'style-loader',
                }),
            },
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['env', {
                                targets: {
                                    browsers: ['> 1%', 'last 2 versions'],
                                },
                            }],
                        ],
                    },
                },
            },
        ],
    },
    plugins: Object.values(plugins),
};
