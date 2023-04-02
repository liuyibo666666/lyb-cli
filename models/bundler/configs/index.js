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
    this.plugins = new BuildConfigPluginManager(option);
  }

  getBuildConfig(custom) {
    const config = this.getBrowserBuildConfig();
    const baseConfig = this.getBaseBuildConfig(custom);
    const mergedConfig = WebpackMerge.merge(baseConfig, config, custom ?? {});
    return mergedConfig;
  }

  getBaseBuildConfig(custom) {
    return {
      name: `${this.appName}`,
      entry: this.input,
      output: {
        publicPath: `/${this.appName}/`,
        path: path.resolve(this.output, this.appName),
      },
      mode: this.isDev ? 'development' : 'production',
      cache: {
        type: 'filesystem',
      },
      plugins: this.plugins.getWebpackPlugins(),
      module: {
        rules: getRules(this.isDev, custom),
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
        // module: true,
        chunkFilename: this.isDev ? 'js/[name].chunk.mjs' : 'js/[name].[contenthash:8].chunk.mjs',
        filename: this.isDev ? 'js/[name].mjs' : 'js/[name].[contenthash:8].mjs',
      },
      experiments: {
        // html-webpack-plugin 目前还不支持 https://github.com/jantimon/html-webpack-plugin/issues/1492
        outputModule: false,
      },
    };
  }
}

module.exports = BuildConfigManager;
