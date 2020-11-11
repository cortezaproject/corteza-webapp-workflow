import Router from 'vue-router'
import routes from './views/routes.js'

export default new Router({
  base: '/',
  mode: 'history',
  routes,
})
