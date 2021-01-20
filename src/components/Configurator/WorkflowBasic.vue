<template>
  <div>
    <b-form-group
      label="Label"
    >
      <b-form-input
        v-model="workflow.handle"
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
}
</script>

