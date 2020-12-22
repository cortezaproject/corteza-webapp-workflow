import Vue from 'vue'

import './config-check'
import './console-splash'

import './plugins'
import './mixins'

import router from './router'

export default (options = {}) => {
  options = {
    el: '#app',
    name: 'workflow',
    template: '<div id="workflow" class="h-100"><router-view/></div>',

    router,

    // Any additional options we want to merge
    ...options,
  }

  return new Vue(options)
}
