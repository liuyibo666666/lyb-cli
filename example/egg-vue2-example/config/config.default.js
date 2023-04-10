/* eslint valid-jsdoc: "off" */

'use strict';

const path = require('path');

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = (appInfo) => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = {
    assetsManifest: {
      // 目前给模版引擎使用
      baseDir: path.resolve(appInfo.baseDir, 'public/dist'),
    },
    static: {
      prefix: '/',
      dir: path.join(appInfo.baseDir, 'public/dist'), // `String` or `Array:[dir1, dir2, ...]` 静态化目录,可以设置多个静态化目录
      dynamic: true, // 如果当前访问的静态资源没有缓存，则缓存静态文件，和`preload`配合使用；
      preload: false,
      maxAge: 31536000, // in prod env, 0 in other envs
      buffer: true, // in prod env, false in other envs
    },
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1670314663892_8346';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
