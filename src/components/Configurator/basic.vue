<template>
  <div>
    <b-form-group
      label="Label"
    >
      <b-form-input
        v-model="item.node.value"
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

  watch: {
    // Used to detect changes in node value
    valueID: {
      handler (newValueID, oldValueID) {
        const [nID, nValue] = newValueID.split('-')
        const [oID, oValue] = oldValueID.split('-')
        if (nID === oID) {
          if (nValue !== oValue) {
            this.$emit('update-value', this.item.node.value)
          }
        }
      }
    }
  },

  computed: {
    // Used to detect changes in node value
    valueID () {
      return `${this.item.node.id}-${this.item.node.value}`
    }
  }
}
</script>
