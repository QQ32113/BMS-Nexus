import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../Views/Home.vue'
import List from '../Views/List.vue'
export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/Home' },
    { path: '/Home', component: Home },
    { path: '/List', component: List }
  ]
})
