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
import WorkflowHeader from 'corteza-workflow/src/components/Header'
import { components } from '@cortezaproject/corteza-vue'
const { CPermissionsModal } = components

export default {
  components: {
    WorkflowHeader,
    CPermissionsModal,
  },

  beforeCreate () {
    this.$root.$on('alert', this.displayToast)
  },

  methods: {
    displayToast ({ title, message, variant, countdown }) {
      this.$bvToast.toast(message, {
        title,
        variant,
        autoHideDelay: countdown,
        toaster: 'b-toaster-bottom-left'
      })
    }
  },
}
</script>
