<template>
  <b-card
    class="flex-grow-1 border-bottom border-light rounded-0"
  >
    <b-card-header
      header-tag="header"
      class="bg-white p-0 mb-3"
    >
      <h5
        class="mb-0"
      >
        Configuration
      </h5>
    </b-card-header>
    <b-card-body
      class="p-0"
    >
      <b-form-group
        label="Error message(expression)"
        label-class="text-primary"
        class="mb-0"
      >
        <b-form-input
          v-model="item.config.arguments[0].value"
          placeholder="Error"
          @change="$root.$emit('change-detected')"
        />
      </b-form-group>
    </b-card-body>
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
        value: '',
      },
    ])
  },
}
</script>
