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
        {{ $t('configurator:configuration') }}
      </h5>
    </b-card-header>
    <b-card-body
      class="p-0"
    >
      <b-form-group
        :label="$t('general:error-expression')"
        label-class="text-primary"
        class="mb-0"
      >
        <expression-editor
          :value.sync="item.config.arguments[0].expr"
          lang="javascript"
          font-size="18px"
          show-line-numbers
          :border="false"
          @input="valueChanged"
        />
      </b-form-group>
    </b-card-body>
  </b-card>
</template>

<script>
import base from './base'
import ExpressionEditor from '../ExpressionEditor'

export default {

  components: {
    ExpressionEditor,
  },
  extends: base,

  created () {
    let args = [{
      target: 'message',
      type: 'String',
      expr: '',
    }]

    if (this.item.config.arguments && this.item.config.arguments.length) {
      args = this.item.config.arguments.map(({ target, type, value, expr }) => {
        return {
          target,
          type,
          expr: expr || (value ? `"${value}"` : ''),
        }
      })
    }

    this.$set(this.item.config, 'arguments', args)
  },

  methods: {
    valueChanged (value) {
      this.$emit('update-default-value', {
        value: `Stop workflow with error: ${value}`,
        force: !this.item.node.value,
      })
    },
  },
}
</script>
