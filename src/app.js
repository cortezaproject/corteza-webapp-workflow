import Vue from 'vue'

import './config-check'
import './console-splash'

import './plugins'
import './mixins'
import './components'

import i18n from './i18n'

import router from './router'

export default (options = {}) => {
  options = {
    el: '#app',
    name: 'workflow',
    template: '<div id="workflow" class="h-100"><router-view/></div>',

    router,
    i18n: i18n(),

    // Any additional options we want to merge
    ...options,
  }

  return new Vue(options)
}
