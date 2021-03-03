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
    template: '<div v-if="loaded" class="h-100"><router-view/></div>',

    data: () => ({ loaded: false }),

    async created () {
      this.$auth.handle().then(({ accessTokenFn, user }) => {
        this.loaded = true
      })
      .catch((err) => {
        if (err instanceof Error && err.message === 'Unauthenticated') {
          // user not logged-in,
          // start with authentication flow
          this.$auth.startAuthenticationFlow()
          return
        }

        throw err
      })
    },

    router,
    i18n: i18n(),

    // Any additional options we want to merge
    ...options,
  }

  return new Vue(options)
}
