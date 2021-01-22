<template>
  <b-tabs
    active-nav-item-class="bg-grey"
    nav-wrapper-class="bg-white"
    active-tab-class="tab-content h-auto overflow-auto p-2"
    card
  >
    <b-tab
      active
      title="General"
    >
      <workflow-basic
        v-if="item.workflowID"
        :workflow="item"
      />

      <basic
        v-else
        :item="item"
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
import WorkflowBasic from './WorkflowBasic'
import * as Configurators from './loader'

export default {
  components: {
    ...Configurators,
    WorkflowBasic,
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

<style lang="scss" scoped>
.tab-content {
  max-height: 70vh;
}
</style>
