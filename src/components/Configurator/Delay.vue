<template>
  <div
    v-if="!processing"
  >
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
          {{ $t('configurator:configuration') }}
        </h5>
      </b-card-header>
      <b-card-body
        class="p-0"
      >
        <b-form-group
          :label="$t('general:offset')"
          label-class="text-primary"
          class="mb-0"
        >
          <b-form-input
            v-model="item.config.arguments[0].value"
            placeholder="10s"
            @input="valueChanged"
          />
        </b-form-group>
      </b-card-body>
    </b-card>
  </div>
</template>

<script>
import base from './base'

export default {
  extends: base,

  watch: {
    'item.config.stepID': {
      immediate: true,
      async handler () {
        this.processing = true

        this.$set(this.item.config, 'arguments', this.item.config.arguments || [{
          target: 'offset',
          type: 'Duration',
          value: '',
        }])

        this.processing = false
      },
    },
  },

  methods: {
    valueChanged (value) {
      this.$emit('update-default-value', {
        value: `Delay workflow execution for ${value}`,
        force: !this.item.node.value,
      })

      this.$root.$emit('change-detected')
    },
  },
}
</script>
