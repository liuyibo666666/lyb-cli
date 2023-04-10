const fs = require('fs');
const path = require('path');
const PRESSURE_MEASUREMENT_KEY = 'X-Shadow';

// function fetch(options) {
//   // response interceptors
//   axios.interceptors.response.use(
//     response => response,
//     error => Promise.reject(error)
//   );

//   return axios(options)
//     .then(response => response)
//     .catch(err => {
//       // if (err.response.data) return Promise.reject(err.response.data);
//       if (err && err.response && err.response.data) {
//         return Promise.reject(err.response.data);
//       }
//       return Promise.reject(err);
//     });
// }

module.exports = {
  async curlWithSpan(url, options = {}, span) {
    const currentSpan = span || this.rootSpan;
    let requestSpan;
    let mergedOptions = options;
    if (currentSpan) {
      const { pathname } = new URL(url);
      const spanName = `[HttpRequest] ${options.method || 'GET'} ${pathname}`;
      requestSpan = this.tracer.startSpan(spanName, { childOf: currentSpan });
      const defaultHeader = requestSpan.getTransportMeta();
      mergedOptions = {
        ...options,
        headers: Object.assign(defaultHeader, options.headers),
        timing: true,
      };
    }
    try {
      const result = await this.curl(url, mergedOptions);
      const { timing } = result.res;
      requestSpan.setTag('request.timing.queuing', timing.queuing);
      requestSpan.setTag('request.timing.dnslookup', timing.dnslookup);
      requestSpan.setTag('request.timing.connected', timing.connected);
      requestSpan.setTag('request.timing.requestSent', timing.requestSent);
      requestSpan.setTag('request.timing.waiting', timing.waiting);
      requestSpan.setTag('request.timing.contentDownload', timing.contentDownload);
      return result;
    } finally {
      if (requestSpan) requestSpan.finish();
    }
  },

  fetchApi(url, options = {}) {
    const isPressureMeasurement = this.get(PRESSURE_MEASUREMENT_KEY); // this.get

    if (isPressureMeasurement !== '') {
      const defaultHeader = {
        [PRESSURE_MEASUREMENT_KEY]: isPressureMeasurement,
      };
      options.headers = Object.assign(defaultHeader, options.headers);
    }

    return this.curlWithSpan(url, options);
  },

  get logger() {
    return this.app.logger;
  },

  /**
   * 客户端渲染
   * @param {*} name 名称
   * @param {*} data 要挂在到浏览器的数据
   */
  async renderClient(name, data) {
    const { config } = this.app;
    if (!config.assetsManifest || !config.assetsManifest.baseDir) {
      throw new Error('请在Config.default.js中配置config.assetsManifest.baseDir!')
    }
    const entryPath = path.join(config.assetsManifest.baseDir, name, 'index.html');
    try {
      const preHtml = fs.readFileSync(entryPath, 'utf-8');
      const html = preHtml.replace(
        '<head>',
        `<head><script> window.__INITIAL_STATE__ = ${JSON.stringify(data || {})} </script>`
      );
      this.body = html;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
};
