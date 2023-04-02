module.exports = function getFontRules(isDev) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const testRule = /\.(woff|woff2|ttf|eot|svg)$/;

  return {
    test: testRule,
    loader: 'file-loader',
    options: {
      name: isDev
        ? 'font/[name].[ext]'
        : 'font/[name].[contenthash:8].[ext]',
    },
  };
}
