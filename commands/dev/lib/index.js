const Command = require('@lyb-cli/command');
const log = require('@lyb-cli/log');
const { Bundler } = require('@lyb-cli/bundler');
const { fileAccess } = require('@lyb-cli/utils');
const path = require('path');

const CONFIG_NAME = 'lyb-cli-config.js';

class DevCommand extends Command {
  customBuildConfig;
  port;
  constructor(argv) {
    super(argv);
    this.port = argv[0].port || 7001;
  }

  async exec() {
    this.prepare();
    this.customBuildConfig.isDev = true;
    this.customBuildConfig.port = this.port;
    this.devServerTask();
  }

  prepare() {
    const configPath = path.resolve(process.cwd(), CONFIG_NAME);
    // 1. 判断配置文件是否存在
    if (!fileAccess(configPath)) {
      throw new Error('项目配置文件不存在，请在项目根目录下创建 lyb-cli-config.js，并配置相关信息！');
    }
    // 2. 判断配置文件关键信息是否存在
    const config = require(configPath);
    if (!config || !config.build || !config.build.input || !config.build.output) {
      throw new Error('lyb-cli-config.js，配置信息不全！');
    }
    this.customBuildConfig = config.build;
  }

  async devServerTask() {
    const bundler = new Bundler(this.customBuildConfig);
    await bundler.dev();
  }
}

function dev(argv) {
  log.verbose('执行dev指令');
  log.verbose('buildArgvs', argv);
  return new DevCommand(argv);
}

module.exports = dev;
module.exports.DevCommand = DevCommand;
