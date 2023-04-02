const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');
const Webpack = require('webpack');
const VueLoader = require('vue-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer');
const shortid = require('shortid');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = Webpack.container;

const VUE_STATIC_TEMPLATE = fs.readFileSync(
  path.resolve(__dirname, './templates/vue-static-template.html'),
  'utf-8',
);

class BuildConfigPluginManager {
  isDev;
  output;
  appName;

  constructor(option) {
    this.isDev = option.isDev;
    this.output = option.output;
    this.appName = option.appName;
  }

  getWebpackPlugins() {
    const plugins = [
      this.getVueLoaderPlugin(),
      this.getDefinePlugin(),
      this.getMiniCssExtractPlugin(),
      ...this.getHTMLPlugins(),
      this.getBundleAnalyzerPlugin(),
      this.getModuleFederationPlugin(),
    ];
    return plugins.filter(p => p !== undefined);
  }

  getVueLoaderPlugin() {
    // 强制转换，VueLoader 不支持 webpack 5.0
    return new VueLoader.VueLoaderPlugin();
  }

  getDefinePlugin() {
    return new Webpack.DefinePlugin({
      'process.env.UNIT_TEST': '0',
      'process.env.RUN_ENV': JSON.stringify(process.env.BUILD_ENV),
      'process.env.NODE_ENV': JSON.stringify(this.isDev ? 'development' : 'production'),
      // @deprecated
      'process.env.BUILD_ENV': JSON.stringify(process.env.BUILD_ENV),
      // @deprecated
      'process.env.CONTAINER_TYPE': '"browser"',
      // @deprecated
      GLOBAL_VERSION_KEY: `'${shortid.generate()}'`,
    });
  }

  getMiniCssExtractPlugin() {
    if (this.isDev) return;
    return new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      ignoreOrder: true,
    });
  }

  getHTMLPlugins() {
    return [
      new HTMLWebpackPlugin({
        filename: 'index.html',
        templateContent: VUE_STATIC_TEMPLATE,
      }),
    ];
  }

  getSharedModule() {
    return {
      vue: { singleton: false, eager: true },
      'core-js': { singleton: false, eager: true },
      'vue-router': { singleton: true, eager: true },
      'vue-stack-router': { singleton: true, eager: true },
    };
  }

  getModuleFederationPlugin() {
    return new ModuleFederationPlugin({
      name: this.appName,
      shared: this.getSharedModule(),
    });
  }

  getBundleAnalyzerPlugin() {
    if (process.env.ANALYZER) {
      return new BundleAnalyzerPlugin.BundleAnalyzerPlugin({
        analyzerMode: 'static',
        defaultSizes: 'stat',
      });
    }
  }
}

module.exports = BuildConfigPluginManager;
