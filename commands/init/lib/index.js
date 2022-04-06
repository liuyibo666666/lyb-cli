'use strict';

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const glob = require('glob');
const ejs = require('ejs');
const semver = require('semver');
const Command = require('@lyb-cli/command');
const log = require('@lyb-cli/log');
const { spinnerStart, sleep, execAsync } = require('@lyb-cli/utils');

const homePath = process.env.CLI_HOME_PATH;

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

const WHITE_COMMAND = ['npm', 'cnpm'];

const COMPONENT_FILE = '.componentrc';

class InitCommand extends Command {
  initInfo = '';

  constructor(argv) {
    super(argv);
    this.projectName = argv[0];
  }

  async exec() {
    try {
      // 1. 准备阶段
      this.initInfo = await this.prepare();
      log.verbose('projectInfo', this.initInfo);
      if (this.initInfo) {
        // 2. 安装模板
        await this.installTemplate();
      }
    } catch (e) {
      log.error(e.message);
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(e);
      }
    }
  }

  async prepare() {
    if (!this.projectName) {
      throw new Error('请输入项目/组件名称');
    }
    // 0. 判断项目模板是否存在
    this.projectTemplates = await this.getProjectTemplate();
    if (!this.projectTemplates || this.projectTemplates.length === 0) {
      throw new Error('没有安装任何模板, 请执行: lyb-cli install [模板名称] 安装模板。\n 详情参考:https://github.com/liuyibo666666/lyb-cli/blob/master/README.md。');
    }
    // 1. 判断当前目录是否为空
    // const localPath = process.cwd();
    // if (!this.isDirEmpty(localPath)) {
    //   let ifContinue = false;
    //   if (!this.force) {
    //     // 询问是否继续创建
    //     ifContinue = (
    //       await inquirer.prompt({
    //         type: 'confirm',
    //         name: 'ifContinue',
    //         default: false,
    //         message: '当前文件夹不为空，是否继续创建项目？'
    //       })
    //     ).ifContinue;
    //     if (!ifContinue) {
    //       return;
    //     }
    //   }
    //   // 2. 是否启动强制更新
    //   if (ifContinue || this.force) {
    //     // 给用户做二次确认
    //     const { confirmDelete } = await inquirer.prompt({
    //       type: 'confirm',
    //       name: 'confirmDelete',
    //       default: false,
    //       message: '是否确认清空当前目录下的文件？'
    //     });
    //     if (confirmDelete) {
    //       // 清空当前目录
    //       fse.emptyDirSync(localPath);
    //     }
    //   }
    // }
    return this.getProjectInfo();
  }

  async installTemplate() {
    log.verbose('initInfo', this.initInfo);
    if (this.initInfo) {
      await this.installNormalTemplate();
    } else {
      throw new Error('项目模板信息不存在！');
    }
  }

  async installNormalTemplate() {
    log.verbose('initInfo', this.initInfo);
    // 拷贝模板代码至当前目录
    let spinner = spinnerStart('正在安装模板...');
    await sleep();
    const templatePath = path.resolve(
      this.initInfo.projectTemplate,
      'template'
    );
    const targetPath = path.resolve(process.cwd(), this.projectName);
    try {
      fse.ensureDirSync(templatePath);
      fse.ensureDirSync(targetPath);
      fse.copySync(templatePath, targetPath);
      spinner.stop(true);
      log.success('模板安装成功');
    } catch (e) {
      log.success('模板安装失败');
      // TODO失败则删除已安装的文件
      throw e;
    }
    const ignore = ['**/node_modules/**', '**/public/**'];
    await this.ejsRender({ ignore });
    // 如果是组件，则生成组件配置文件
    // await this.createComponentFile(targetPath);
    // const { installCommand, startCommand } = this.templateInfo;
    // 依赖安装
    // await this.execCommand(installCommand, '依赖安装失败！');
    // 启动命令执行
    // await this.execCommand(startCommand, '启动执行命令失败！');
  }

  async ejsRender(options) {
    const dir = path.resolve(process.cwd(), this.projectName);
    const projectInfo = this.initInfo;
    return new Promise((resolve, reject) => {
      glob(
        '**',
        {
          cwd: dir,
          ignore: options.ignore || '',
          nodir: true
        },
        function (err, files) {
          if (err) {
            reject(err);
          }
          Promise.all(
            files.map(file => {
              const filePath = path.join(dir, file);
              return new Promise((resolve1, reject1) => {
                ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
                  if (err) {
                    reject1(err);
                  } else {
                    fse.writeFileSync(filePath, result);
                    resolve1(result);
                  }
                });
              });
            })
          )
            .then(() => {
              resolve();
            })
            .catch(err => {
              reject(err);
            });
        }
      );
    });
  }

  checkCommand(cmd) {
    if (WHITE_COMMAND.includes(cmd)) {
      return cmd;
    }
    return null;
  }

  async execCommand(command, errMsg) {
    let ret;
    if (command) {
      const cmdArray = command.split(' ');
      const cmd = this.checkCommand(cmdArray[0]);
      if (!cmd) {
        throw new Error('命令不存在！命令：' + command);
      }
      const args = cmdArray.slice(1);
      ret = await execAsync(cmd, args, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
    }
    if (ret !== 0) {
      throw new Error(errMsg);
    }
    return ret;
  }

  async createComponentFile(targetPath) {
    const templateInfo = this.templateInfo;
    const projectInfo = this.projectInfo;
    if (templateInfo.tag.includes(TYPE_COMPONENT)) {
      const componentData = {
        ...projectInfo,
        buildPath: templateInfo.buildPath,
        examplePath: templateInfo.examplePath,
        npmName: templateInfo.npmName,
        npmVersion: templateInfo.version
      };
      const componentFile = path.resolve(targetPath, COMPONENT_FILE);
      fs.writeFileSync(componentFile, JSON.stringify(componentData));
    }
  }

  async getProjectTemplate() {
    const templateDir = path.resolve(
      homePath,
      'template/node_modules/@lyb-cli'
    );
    const templates = [];
    try {
      const dir = await fs.promises.opendir(templateDir);
      for await (const dirent of dir) {
        if (dirent.name.startsWith('template')) {
          templates.push({
            name: dirent.name,
            value: path.resolve(templateDir, dirent.name)
          });
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
    return templates;
  }

  async getProjectInfo() {
    function isValidName(v) {
      return /^(@[a-zA-Z0-9-_]+\/)?[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
        v
      );
    }

    let projectInfo = {};
    let isProjectNameValid = false;
    if (isValidName(this.projectName)) {
      isProjectNameValid = true;
      projectInfo.projectName = this.projectName;
    }
    // 1. 选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TYPE_PROJECT,
      choices: [
        {
          name: '项目',
          value: TYPE_PROJECT
        },
        {
          name: '组件',
          value: TYPE_COMPONENT
        }
      ]
    });
    log.verbose('type', type);
    const title = type === TYPE_PROJECT ? '项目' : '组件';
    const projectNamePrompt = {
      type: 'input',
      name: 'projectName',
      message: `请输入${title}名称`,
      default: '',
      validate: function (v) {
        const done = this.async();
        setTimeout(function () {
          // 1.首字符必须为英文字符
          // 2.尾字符必须为英文或数字，不能为字符
          // 3.字符仅允许"-_"
          if (!isValidName(v)) {
            done(`请输入合法的${title}名称`);
            return;
          }
          done(null, true);
        }, 0);
      }
      // filter: function (v) {
      //   return v;
      // }
    };
    const projectPrompt = [];
    if (!isProjectNameValid) {
      projectPrompt.push(projectNamePrompt);
    }
    projectPrompt.push(
      {
        type: 'input',
        name: 'projectVersion',
        message: `请输入${title}版本号`,
        default: '1.0.0',
        validate: function (v) {
          const done = this.async();
          setTimeout(function () {
            if (!!!semver.valid(v)) {
              done('请输入合法的版本号');
              return;
            }
            done(null, true);
          }, 0);
        },
        filter: function (v) {
          if (!!semver.valid(v)) {
            return semver.valid(v);
          } else {
            return v;
          }
        }
      },
      {
        type: 'list',
        name: 'projectTemplate',
        message: `请选择${title}模板`,
        choices: this.projectTemplates
      }
    );
    if (type === TYPE_PROJECT) {
      // 2. 获取项目的基本信息
      const project = await inquirer.prompt(projectPrompt);
      projectInfo = {
        ...projectInfo,
        type,
        ...project
      };
    } else if (type === TYPE_COMPONENT) {
      const descriptionPrompt = {
        type: 'input',
        name: 'componentDescription',
        message: '请输入组件描述信息',
        default: '',
        validate: function (v) {
          const done = this.async();
          setTimeout(function () {
            if (!v) {
              done('请输入组件描述信息');
              return;
            }
            done(null, true);
          }, 0);
        }
      };
      projectPrompt.push(descriptionPrompt);
      // 2. 获取组件的基本信息
      const component = await inquirer.prompt(projectPrompt);
      projectInfo = {
        ...projectInfo,
        type,
        ...component
      };
    }
    // 生成classname
    if (projectInfo.projectName) {
      projectInfo.name = projectInfo.projectName;
      projectInfo.className = require('kebab-case')(
        projectInfo.projectName
      ).replace(/^-/g, '');
    }
    if (projectInfo.projectVersion) {
      projectInfo.version = projectInfo.projectVersion;
    }
    if (projectInfo.componentDescription) {
      projectInfo.description = projectInfo.componentDescription;
    }
    return projectInfo;
  }

  // isDirEmpty(localPath) {
  //   let fileList = fs.readdirSync(localPath);
  //   // 文件过滤的逻辑
  //   fileList = fileList.filter(
  //     file => !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
  //   );
  //   return !fileList || fileList.length <= 0;
  // }

  // createTemplateChoice() {
  //   return this.projectTemplates.map(item => ({
  //     value: item.npmName,
  //     name: item.name
  //   }));
  // }
}

function init(argv) {
  log.verbose('执行init指令');
  log.verbose('initArgvs', argv);
  return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;
