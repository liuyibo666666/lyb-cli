const os = require('os');
const path = require('path');
const WebpackMerge = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const BuildConfigPluginManager = require('./plugins');
const getRules = require('./rules');

class BuildConfigManager {
  isDev;
  appName;
  output;
  plugins;

  constructor(option) {
    this.isDev = option.isDev;
    this.appName = option.appName;
    this.input = option.input;
    this.output = option.output;
    this.customWebpack = option.webpack || {};
    this.plugins = new BuildConfigPluginManager(option);
  }

  getBuildConfig() {
    const config = this.getBrowserBuildConfig();
    const baseConfig = this.getBaseBuildConfig();
    const mergedConfig = WebpackMerge.merge(baseConfig, config, this.customWebpack);
    return mergedConfig;
  }

  getBaseBuildConfig() {
    return {
      name: `${this.appName}`,
      entry: this.input,
      output: {
        publicPath: `/${this.appName}`,
        path: path.resolve(this.output, this.appName),
      },
      mode: this.isDev ? 'development' : 'production',
      cache: {
        type: 'filesystem',
      },
      plugins: this.plugins.getWebpackPlugins(),
      module: {
        rules: getRules(this.isDev, this.customWebpack),
      },
      devtool: this.isDev ? 'eval-cheap-module-source-map' : 'cheap-module-source-map',
      resolve: {
        extensions: [ '.js', '.json', '.ts', '.vue' ],
      },
      optimization: !this.isDev
        ? {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              parallel: Math.min(os.cpus().length - 1, 16),
              terserOptions: {
                safari10: true,
              },
            }),
          ], // Terser plugin not support webpack 5.0 in types.
          runtimeChunk: true,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendors: {
                name: 'chunk-vendors',
                test: /[\\/]node_modules[\\/]/,
                priority: -10,
                chunks: 'initial',
              },
              common: {
                name: 'chunk-common',
                minChunks: 2,
                priority: -20,
                chunks: 'initial',
                reuseExistingChunk: true,
              },
            },
          },
        }
        : undefined,
    };
  }

  getBrowserBuildConfig() {
    return {
      target: [ 'web', 'es5' ],
      output: {
        chunkFilename: this.isDev ? 'js/[name].chunk.js' : 'js/[name].[contenthash:8].chunk.js',
        filename: this.isDev ? 'js/[name].js' : 'js/[name].[contenthash:8].js',
      },
      experiments: {
        // html-webpack-plugin 目前还不支持 https://github.com/jantimon/html-webpack-plugin/issues/1492
        outputModule: false,
      },
    };
  }
}

module.exports = BuildConfigManager;
