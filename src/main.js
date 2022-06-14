/*
 * @Author: Jack Jparrow
 * @Date: 2022-05-19 08:59:39
 * @LastEditTime: 2022-05-29 21:20:48
 * @LastEditors: Jack Jparrow
 * @Description: 
 */
import Vue from 'vue'
import App from './App.vue'
import mavonEditor from 'mavon-editor' // 引入 mavon-editor 组件
import 'mavon-editor/dist/css/index.css' // 引入 mavon-editor 需要的样式文件
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css'; 

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')

Vue.use(mavonEditor); // Vue 全局注册组件

Vue.use(ElementUI);

new Vue({
  el: '#app',
  render: h => h(App)
});