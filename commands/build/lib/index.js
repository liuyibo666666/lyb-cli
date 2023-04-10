const Command = require('@lyb-cli/command');
const log = require('@lyb-cli/log');
const { spinnerStart, fileAccess } = require('@lyb-cli/utils');
const { Bundler } = require('@lyb-cli/bundler');
const path = require('path');

const CONFIG_NAME = 'lyb-cli-config.js';

class BuildCommand extends Command {
  customBuildConfig;
  isDev;
  analyzer;
  constructor(argv) {
    super(argv);
    this.isDev = !argv[0].production;
    this.analyzer = argv[0].analyzer;
  }

  async exec() {
    // 1. 执行准备
    this.prepare();
    if (this.analyzer) {
      process.env.ANALYZER = 'true';
    }
    this.customBuildConfig.isDev = this.isDev;
    // 2. 执行构建
    this.buildTask();
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

  async buildTask() {
    try {
      const spinner = spinnerStart('开始构建...');
      const timeStart = Date.now();
      const bundler = new Bundler(this.customBuildConfig);
      log.verbose('Webpack config:', bundler.buildConfig);
      const output = await bundler.build();
      spinner.stop(true);
      log.info(`${output.output}\n`);
      const time = Math.round((Date.now() - timeStart) / 100) / 10;
      log.success(`App [${output.app}] with target [${output.target}] build successfully in ${time}s\n`);
    } catch (error) {
      log.success('构建失败');
      throw error;
    }
  }
}

function build(argv) {
  log.verbose('执行build指令');
  log.verbose('buildArgvs', argv);
  return new BuildCommand(argv);
}

module.exports = build;
module.exports.BuildCommand = BuildCommand;
