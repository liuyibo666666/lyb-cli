'use strict';

const path = require('path');
const userHome = require('user-home');
const Command = require('@lyb-cli/command');
const log = require('@lyb-cli/log');
const Package = require('@lyb-cli/package');
const { spinnerStart, sleep } = require('@lyb-cli/utils');

class InstallCommand extends Command {
  constructor(argv) {
    super(argv);
  }

  async exec() {
    try {
      // 1. 准备阶段, 整合相关信息
      const templateInfo = this.prepare();
      log.verbose('templateInfo', templateInfo);
      // 2. 下载模板
      await this.downloadTemplate(templateInfo);
    } catch (e) {
      log.error(e.message);
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(e);
      }
    }
  }

  prepare() {
    if (!this._argv[0]) {
      throw new Error('模板名称不能为空!');
    }
    const targetPath = path.resolve(userHome, '.lyb-cli', 'template');
    const storeDir = path.resolve(
      userHome,
      '.lyb-cli',
      'template',
      'node_modules'
    );
    return {
      targetPath,
      storeDir,
      packageName: this._argv[0],
      packageVersion: 'latest'
    };
  }

  async downloadTemplate(templateInfo) {
    const templateNpm = new Package(templateInfo);
    if (!(await templateNpm.exists())) {
      const spinner = spinnerStart('正在下载模板...');
      await sleep();
      try {
        await templateNpm.install();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop(true);
        if (await templateNpm.exists()) {
          log.success('下载模板成功');
          this.templateNpm = templateNpm;
        }
      }
    }
  }
}

function install(argv) {
    log.verbose('安装模板命令');
  log.verbose('argv', argv);
  return new InstallCommand(argv);
}

module.exports = install;
module.exports.InstallCommand = InstallCommand;
