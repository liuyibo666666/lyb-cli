import Vue from 'vue';
import App from './app.vue';
import router from './router';


//阻止控制台显示你正处于生产部署期间请确保启用生产模式的警告
Vue.config.productionTip = false

//创建vue对象,直接在里面挂载router和store
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
