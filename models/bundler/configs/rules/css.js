const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PostcssImport = require('postcss-import');
const PostcssPresetEnv = require('postcss-preset-env');
const PostcssCssnext = require('postcss-cssnext');

module.exports = function getCSSRules(isDev) {
  return {
    test: /\.(sa|sc|c|postc)ss$/,
    use: [
      isDev ? 'vue-style-loader' : MiniCssExtractPlugin.loader,

      {
        loader: 'css-loader',
        options: {
          importLoaders: 1,
          esModule: false, // Remove when issues resolved https://github.com/vuejs/vue-style-loader/issues/46
        },
      },
      {
        loader: 'postcss-loader',
        options: { postcssOptions: getPostcssConfig() },
      },
    ],
  };
};

function getPostcssConfig() {
  return {
    plugins: [
      PostcssImport(),
      PostcssPresetEnv({
        stage: 1,
        browsers: 'and_chr>=57,ios_saf>=9',
      }),
      PostcssCssnext({
        browsers: ['last 2 versions', '> 5%'],
        features: {
          customProperties: {
            variables: {
              'primary-color': 'red',
              'secondary-color': 'blue',
            },
          },
        },
      }),
    ],
  };
}
