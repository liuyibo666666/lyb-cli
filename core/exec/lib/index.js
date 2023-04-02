'use strict';

const log = require('@lyb-cli/log');

const SETTINGS = {
  init: '@lyb-cli/init',
  install: '@lyb-cli/install',
  build: '@lyb-cli/build',
  publish: '',
  add: ''
};

async function exec() {
  const homePath = process.env.CLI_HOME_PATH;
  log.verbose('homePath', homePath);

  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  // 指令包名
  const packageName = SETTINGS[cmdName];
  try {
    const args = Array.from(arguments);
    const cmd = args[args.length - 1];
    const o = Object.create(null);
    // 参数瘦身
    Object.keys(cmd).forEach(key => {
      if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
        o[key] = cmd[key];
      }
    });
    args[args.length - 1] = o;
    // 引入并执行指令
    const task = require(packageName);
    if (!task) {
      log.verbose('暂时还没有该功能');
      return;
    }
    task(args);
  } catch (e) {
    log.error(e.message);
  }
}

module.exports = exec;
