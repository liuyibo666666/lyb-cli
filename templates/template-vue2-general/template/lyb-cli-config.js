const path = require('path');

module.exports = {
  build: {
    appName: "<%= className %>",
    input: path.resolve(__dirname, './web/main.js'),
    output: path.resolve(__dirname, './public/dist'),
    webpack: {},
  },
};
