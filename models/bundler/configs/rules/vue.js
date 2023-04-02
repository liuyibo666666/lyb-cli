module.exports = function getVueRules() {
  return {
    test: /\.vue$/,
    loader: 'vue-loader',
  };
}
