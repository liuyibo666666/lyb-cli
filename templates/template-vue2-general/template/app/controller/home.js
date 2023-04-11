const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    // await this.ctx.render('index.html', {});
    this.ctx.renderClient('egg-vue2-example', {});
  }
}

module.exports = HomeController;