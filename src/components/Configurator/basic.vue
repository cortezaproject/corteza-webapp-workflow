<template>
  <div>
    <b-form-group
      label="Label"
    >
      <b-form-input
        v-model="item.node.value"
      />
    </b-form-group>

    <b-form-group
      v-if="getSelectedItemConfigJSON"
      label="Config"
    >
      <b-form-textarea
        v-model="getSelectedItemConfigJSON"
        rows="10"
      />
    </b-form-group>
  </div>
</template>

<script>
import base from './base'

export default {
  extends: base,
}
</script>
