const Webpack = require('webpack');
const net = require('net');
const WebpackDevServer = require('webpack-dev-server');
const { execAsync } = require('@lyb-cli/utils');

module.exports = async function devServer(port, config, devServerConfig) {
  let eggPort;
  let webpackPort;
  try {
    // 检测端口占用情况
    eggPort = await detect(port);
    webpackPort = await detect(devServerConfig.port);
  } catch (error) {
    throw error;
  }
  devServerConfig.port = webpackPort;
  config.output.publicPath = `http://127.0.0.1:${webpackPort}${devServerConfig.publicPath}/`; // eslint-disable-line @typescript-eslint/no-non-null-assertion, no-param-reassign
  const compiler = Webpack.webpack(config);
  const server = new WebpackDevServer(compiler, devServerConfig);
  return new Promise((resolve, reject) => {
    server.listen(webpackPort, '127.0.0.1', (err) => {
      if (err) reject(err);
      try {
        eggBinDev(eggPort);
      } catch (error) {
        server.close();
      }
      resolve(`webpack Starting server on http://127.0.0.1:${webpackPort}`);
    });
    process.on('SIGINT', () => {
      server.close();
      process.exit();
    });
  });
};

async function eggBinDev(port) {
  const command = ['egg-bin', 'dev'];
  if (port) {
    command.push(`--port=${port}`);
  }
  const ret = await execAsync('npx', command, {
    stdio: 'inherit',
  });
  if (ret !== 0) {
    throw new Error('egg-bin dev 失败');
  }
  console.log(`egg-bin dev exited with code ${code}`);
  return ret;
}

function detect(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(detect(port + 1));
      } else {
        reject(err);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(port);
    });
    server.listen(port);
  });
}

