'use strict';

const semver = require('semver');
const colors = require('colors/safe');
const log = require('@lyb-cli/log');

const LOWEST_NODE_VERSION = '12.0.0';

class Command {
  constructor(argv) {
    // log.verbose('Command constructor', argv);
    if (!argv) {
      throw new Error('参数不能为空！');
    }
    if (!Array.isArray(argv)) {
      throw new Error('参数必须为数组！');
    }
    if (argv.length < 1) {
      throw new Error('参数列表为空！');
    }
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.init());
      chain = chain.then(() => this.exec());
      chain = chain.then(resolve);
      chain.catch(err => {
        log.error(err.message);
        reject(err);
      });
    });
    this.runner = runner;
  }

  initArgs() {
    this._cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, this._argv.length - 1);
    log.verbose('initArgs', this._cmd, this._argv);
  }

  checkNodeVersion() {
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(colors.red(`lyb-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`));
    }
  }

  init() {
    throw new Error('init必须实现！');
  }

  exec() {
    throw new Error('exec必须实现！');
  }
}

module.exports = Command;
