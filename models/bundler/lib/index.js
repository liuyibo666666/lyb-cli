const fs = require('fs');
const BuildConfigManager = require('../configs');
const compile = require('./compile')

// const myConfig = require('./config');

class Bundler {
  buildConfig;
  // TODO 优化 customOption 为属性方便使用
  async build(customOption) {
    if (!customOption) {
      throw new Error(`Invalid config`);
    }
    try {
      await fs.promises.rm(customOption.output, { recursive: true });
    } catch (error) {
      // noop
    }
    const modernConfig = await this.compileByBuildConfig(customOption);
    const output = `Modern 模式构建：\n${modernConfig}`;

    return {
      output,
      appName: customOption.appName,
    };
  }

  devServer() {}

  async compileByBuildConfig(customOption) {
    const configManager = new BuildConfigManager(customOption);
    const config = configManager.getBuildConfig(customOption.webpack);
    this.buildConfig = config;
    const output = await compile(config);
    return output;
  }
}

module.exports = Bundler;
