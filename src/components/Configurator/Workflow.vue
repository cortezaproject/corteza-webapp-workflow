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

    <b-form-group
      label="Description"
    >
      <b-form-textarea
        v-model="workflow.meta.description"
        @input="$root.$emit('change-detected')"
      />
    </b-form-group>

    <b-form-checkbox
      v-model="workflow.enabled"
      @input="$root.$emit('change-detected')"
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
      this.workflow.handle = handle.trim(' ').split(' ').map(s => {
        return s[0].toUpperCase() + s.slice(1).toLowerCase()
      }).join('')

      this.$root.$emit('change-detected')
    }
  }
}
</script>
