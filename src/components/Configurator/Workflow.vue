<template>
  <div>
    <b-form-group
      label="Label"
    >
      <b-form-input
        v-model="workflow.meta.name"
        @input="$root.$emit('change-detected')"
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

    <b-form-group>
      <b-form-checkbox
        v-model="workflow.enabled"
        @input="$root.$emit('change-detected')"
      >
        Enabled
      </b-form-checkbox>
    </b-form-group>

    <c-input-confirm
      size="md"
      :borderless="false"
      @confirmed="$emit('delete')"
    >
      Delete
    </c-input-confirm>
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
