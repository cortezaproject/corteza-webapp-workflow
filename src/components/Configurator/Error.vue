<template>
  <b-card
    class="w-100 h-100 border-0 rounded-lg"
    body-class="p-2"
  >
    <b-form-group
      label="Error message(expression)"
      class="mb-0"
    >
      <b-form-input
        v-model="item.config.arguments[0].value"
        placeholder="Error"
        @input="$root.$emit('change-detected')"
      />
    </b-form-group>
  </b-card>
</template>

<script>
import base from './base'

export default {
  extends: base,

  async created () {
    this.$set(this.item.config, 'arguments', this.item.config.arguments || [
      {
        target: 'message',
        type: 'String',
        value: ''
      }
    ])
  },
}
</script>
