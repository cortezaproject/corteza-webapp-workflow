<template>
  <div>
    <b-form-group
      label="Label"
      label-class="text-primary"
    >
      <b-form-input
        v-model="label"
      />
    </b-form-group>

    <!-- <b-form-group
      v-if="getSelectedItemConfigJSON"
      label="Config"
    >
      <b-form-textarea
        v-model="getSelectedItemConfigJSON"
        rows="10"
      />
    </b-form-group> -->
  </div>
</template>

<script>
import base from './base'

export default {
  extends: base,

  computed: {
    // Ignores exclusiveGateway indexes (#n)
    label: {
      get () {
        if (this.getSourceType) {
          if (this.getSourceType === 'gatewayExclusive') {
            /* eslint-disable no-unused-vars */
            const [edgeID, ...rest] = this.item.node.value.split(' - ')
            return rest.join(' - ')
          }
        }

        return this.item.node.value
      },

      set (label) {
        if (this.getSourceType) {
          if (this.getSourceType === 'gatewayExclusive') {
            /* eslint-disable no-unused-vars */
            const [edgeID, ...rest] = this.item.node.value.split(' - ')
            const newLabel = [edgeID]
            if (label) {
              newLabel.push(label)
            }
            label = newLabel.join(' - ')
          }
        }

        this.item.node.value = label
      },
    },

    getSourceType () {
      const { source } = this.item.node
      if (source && source.style) {
        return source.style
      }
      return undefined
    },

    // Used to detect changes in node value
    valueID () {
      return `${this.item.node.id || '0'}-${this.item.node.value || undefined}`
    },
  },

  watch: {
    // Used to detect changes in node value(label)
    valueID: {
      handler (newValueID, oldValueID) {
        // get ID and label value
        let [nID, ...nValue] = newValueID.split('-')
        let [oID, ...oValue] = oldValueID.split('-')
        nValue = nValue.join('-')
        oValue = oValue.join('-')
        if (nID === oID) {
          if (nValue !== oValue) {
            this.$emit('update-value', this.item.node.value)
          }
        }
      },
    },
  },
}
</script>
