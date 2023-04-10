'use strict';

module.exports = core;

const semver = require('semver');
const colors = require('colors');
const path = require('path');
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
const commander = require('commander');
const log = require('@lyb-cli/log');
const exec = require('@lyb-cli/exec');
const pkg = require('../package.json');
const constant = require('./const');

const program = new commander.Command();

async function core() {
  try {
    await prepare();
    registerCommand();
  } catch (e) {
    log.error(e.message);
  }
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '');

  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化项目')
    .action(exec);

    program
    .command('install <templateName>')
    .action(exec);

    program
    .command('build')
    .option('-p, --production', '生产模式')
    .option('-a, --analyzer', '打包体积分析，开启 BundleAnalyzerPlugin')
    .option('-d, --debug', '是否开启调试模式', false)
    .action(exec);
  // 开启debug模式
  program.on('option:debug', function () {
    process.env.LOG_LEVEL = 'verbose';
    log.level = process.env.LOG_LEVEL;
  });

  program
    .command('dev')
    .option('-p, --port <number>', '端口号', parseInt)
    .option('-d, --debug', '是否开启调试模式', false)
    .action(exec);
  // 开启debug模式
  program.on('option:debug', function () {
    process.env.LOG_LEVEL = 'verbose';
    log.level = process.env.LOG_LEVEL;
  });

  // 对未知命令监听
  program.on('command:*', function (obj) {
    const availableCommands = program.commands.map(cmd => cmd.name());
    console.log(colors.red('未知的命令：' + obj[0]));
    if (availableCommands.length > 0) {
      console.log(colors.red('可用命令：' + availableCommands.join(',')));
    }
  });

  program.parse(process.argv);

  // if (program.args && program.args.length < 1) {
  //   program.outputHelp();
  //   console.log();
  // }
}

async function prepare() {
  checkPkgVersion();
  checkNodeVersion();
  checkRoot();
  checkUserHome();
  checkEnv();
  await checkGlobalUpdate();
}

async function checkGlobalUpdate() {
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  const { getNpmLatestVersion } = require('@lyb-cli/get-npm-info');
  const lastVersion = await getNpmLatestVersion(currentVersion, npmName);
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}，最新版本：${lastVersion}
                更新命令： npm install -g ${npmName}`)
    );
  }
}

function checkEnv() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(userHome, '.env');
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath
    });
  }
  createDefaultConfig();
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome
  };
  if (process.env.CLI_HOME_PATH) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  log.verbose('cliHome', cliConfig['cliHome']);
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登录用户主目录不存在！'));
  }
}

function checkRoot() {
  const rootCheck = require('root-check');
  rootCheck();
}

function checkNodeVersion() {
  const currentVersion = process.version;
  const lowestVersion = constant.LOWEST_NODE_VERSION;
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(
      colors.red(`lyb-cli需要安装${lowestVersion}及以上版本的node`)
    );
  }
}

function checkPkgVersion() {
  log.notice('cli', pkg.version);
}
