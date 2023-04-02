module.exports = function getImageRules(isDev) {
  const testRule = /\.(png|jpg|gif|jpeg)$/;
  return {
    test: testRule,
    loader: 'file-loader',
    options: {
      esModule: false,
      name: isDev
        ? 'img/[name].[ext]'
        : 'img/[name].[contenthash:8].[ext]',
    },
  };
}
