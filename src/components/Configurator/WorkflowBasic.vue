<template>
  <div>
    <b-form-group
      label="Label"
    >
      <b-form-input
        v-model="workflow.meta.name"
        @input="setHandle"
      />
    </b-form-group>
    
    <b-form-checkbox
      v-model="workflow.enabled"
    >
      Enabled
    </b-form-checkbox>
  </div>
</template>

<script>
export default {
  props: {
    workflow: {
      type: Object,
      default: () => {},
    },
  },

  methods: {
    setHandle (handle = '') {
      this.newWorkflow.handle = handle.trim(' ').split(' ').map(s => {
        return string[0].toUpperCase() + string.slice(1).toLowerCase()
      }).join('')
    }
  }
}
</script>

