/* eslint valid-jsdoc: "off" */

'use strict';

const path = require('path');

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = (appInfo) => {
  const config = {
    env: appInfo.env,
    static: {
      enable: false, // 本地环境下关闭静态目录
    },
  };
  return {
    ...config,
  };
};
