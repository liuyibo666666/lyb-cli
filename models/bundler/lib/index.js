const fs = require('fs');
const BuildConfigManager = require('../configs');
const compile = require('./compile');
const devServer = require('./devServer');

// const myConfig = require('./config');

class Bundler {
  customOption;
  buildConfig;
  constructor(customOption) {
    this.customOption = customOption;
  }
  // TODO 优化 customOption 为属性方便使用
  async build() {
    if (!this.customOption) {
      throw new Error(`Invalid config`);
    }
    try {
      await fs.promises.rm(this.customOption.output, { recursive: true });
    } catch (error) {
      // noop
    }
    const modernConfig = await this.compileByBuildConfig();
    const output = `Modern 模式构建：\n${modernConfig}`;

    return {
      output,
      appName: this.customOption.appName,
    };
  }

  async dev() {
    if (!this.customOption) {
      throw new Error(`Invalid config`);
    }
    const configManager = new BuildConfigManager(this.customOption);
    const buildconfig = configManager.getBuildConfig();
    const eggPort = this.customOption.port;
    const devServerConfig = {
      publicPath: `/${this.customOption.appName}`,
      writeToDisk: true,
      open: false,
      hot: true,
      port: 9000,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
    console.log('配置', buildconfig);
    return devServer(eggPort, buildconfig, devServerConfig);
  }

  async compileByBuildConfig() {
    const configManager = new BuildConfigManager(this.customOption);
    const config = configManager.getBuildConfig();
    this.buildConfig = config;
    const output = await compile(config);
    return output;
  }
}

module.exports = {
  Bundler,
  BuildConfigManager,
};
