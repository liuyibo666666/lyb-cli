const getCSSRules = require('./css');
const getFontRules = require('./font');
const getImageRules = require('./image');
const getJSRules = require('./js');
const getVueRules = require('./vue');

module.exports = function getRules(isDev, custom) {
  return [
    getCSSRules(isDev),
    getFontRules(isDev),
    getImageRules(isDev),
    getJSRules(),
    getVueRules(),
  ];
};
