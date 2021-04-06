<template>
  <b-container
    fluid
    class="h-100 m-0 p-0"
  >
    <router-view />
    <c-permissions-modal />
  </b-container>
</template>

<script>
import { components } from '@cortezaproject/corteza-vue'
const { CPermissionsModal } = components

export default {
  components: {
    CPermissionsModal,
  },

  created () {
    this.$root.$on('alert', this.displayToast)
  },

  methods: {
    displayToast ({ title, message, variant, countdown }) {
      this.$bvToast.toast(message, {
        title,
        variant,
        solid: true,
        autoHideDelay: countdown,
        toaster: 'b-toaster-bottom-right',
      })
    },
  },
}
</script>
