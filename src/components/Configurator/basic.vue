<template>
  <div>
    <b-form-group
      label="Label"
      label-class="text-primary"
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
      }
    }
  },

  computed: {
    // Used to detect changes in node value
    valueID () {
      return `${this.item.node.id || '0'}-${this.item.node.value || undefined}`
    }
  }
}
</script>
