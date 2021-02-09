<template>
  <b-tabs
    active-nav-item-class="bg-grey"
    nav-wrapper-class="bg-white"
    active-tab-class="h-100 overflow-auto p-2"
    content-class="h-100"
    card
  >
    <b-tab
      active
      title="General"
    >
      <basic
        :item="item"
        @update-value="$emit('update-value', $event)"
      />
    </b-tab>
    <b-tab
      v-if="stepComponent"
      title="Configure"
      class="h-100"
    >
      <component
        :is="stepComponent"
        :item="item"
        :edges="edges"
        class="h-100"
        @update-edge="$emit('update-edge', $event)"
      />
    </b-tab>
  </b-tabs>
</template>
<script>
import base from './base'
import basic from './basic'
import * as Configurators from './loader'

export default {
  components: {
    ...Configurators,
    basic,
  },

  extends: base,

  computed: {
    stepComponent () {
      return Configurators[this.kind]
    },
  },
}
</script>
