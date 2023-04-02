const Webpack = require('webpack');

module.exports = async function compile(config) {
  const compiler = Webpack.webpack(config);
  // 监听Webpack构建过程
  compiler.hooks.compile.tap('ProgressPlugin', () => {
  });

  compiler.hooks.done.tap('ProgressPlugin', (stats) => {
    // 输出构建结果统计信息
    console.log('\n',
      stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
        assets: false,
        warnings: true,
        errors: true,
      })
    );
  });
  const output = await new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        return reject(err);
      }

      let result = '';
      const { assets } = stats?.toJson({ colors: true });

      if (stats?.hasErrors()) {
        const allErrors = stats.toJson({ colors: true }).errors;
        const errString = allErrors.map((stateError) => getHumanErrorString(stateError)).join('\n');
        return reject(new Error(errString));
      }

      if (stats?.hasWarnings()) {
        const allWarnings = stats.toJson({ colors: true }).warnings;
        result += 'Warnings:\n';
        result += allWarnings.map((stateWarning) => stateWarning.message).join('\n');
        result += '\n';
      }

      result += getHumanAssetString(assets);
      resolve(result);
    });
  });
  await new Promise((r) => setTimeout(r, 300));
  return output;
};

function getFormateString(source, field) {
  if (!source[field]) return '';

  let result = `${field}:\n`;
  if (source[field] instanceof Array) {
    result += JSON.stringify(source[field]);
  } else {
    result += source[field]?.toString() ?? '';
  }

  return result;
}

function getHumanErrorString(source) {
  const fields = ['message', 'stack', 'details', 'moduleName', 'moduleTrace'];
  return fields.map((field) => getFormateString(source, field)).join('\n\n');
}

function getHumanAssetString(assets) {
  let result = 'Assets:';
  const totalSize = assets.reduce((pre, curr) => pre + curr.size, 0);

  result += `(total size: ${getHumanByteSize(totalSize)})\n`;
  assets.forEach(({ name, size }) => {
    result += `  ${name} --- ${getHumanByteSize(size)}\n`;
  });

  return result;
}

function getHumanByteSize(size) {
  const unitMap = [
    { value: 1, unit: 'B' },
    { value: 2, unit: 'KB' },
    { value: 3, unit: 'MB' },
    { value: 4, unit: 'GB' },
  ];

  let targetItem = unitMap.find((item) => size < 1024 ** item.value);

  if (!targetItem) {
    targetItem = unitMap[unitMap.length - 1];
  }
  return `${(size / 1024 ** (targetItem.value - 1)).toFixed(2)} ${targetItem.unit}`;
}

module.exports.getFormateStringUnitTest = process.env.UNIT_TEST ? getFormateString : undefined;
module.exports.getHumanErrorStringUnitTest = process.env.UNIT_TEST ? getHumanErrorString : undefined;
module.exports.getHumanAssetStringUnitTest = process.env.UNIT_TEST ? getHumanAssetString : undefined;
