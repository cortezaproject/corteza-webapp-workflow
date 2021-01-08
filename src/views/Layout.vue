<template>
  <b-container
    fluid
    class="h-100 m-0 p-0"
  >
    <!-- <workflow-header
      v-if="!proccessing"
    /> -->
    <router-view
      v-if="!proccessing"
    />
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

  data () {
    return {
      proccessing: true,
    }
  },

  beforeCreate () {
    this.$auth.check().then((user) => {
      if (!user) {
        // check performed: no error & no user,
        // redirect to auth
        throw new Error()
      }
    }).catch(() => {
      this.$auth.open()
    }).finally(() => {
      this.proccessing = false
    })
  }
}
</script>
