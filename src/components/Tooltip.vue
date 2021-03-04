<template>
  <b-tooltip
    :id="kind"
    :target="kind"
    triggers="hover"
    placement="right"
    variant="light"
    custom-class="ml-2"
    noninteractive
    @hide="show = false"
    @show="show = true"
  >
    <transition name="fade">
      <b-card
        v-if="show"
        :img-src="img"
        :img-alt="kind"
        img-height="100px"
        img-top
        :title="title"
        class="text-left"
      >
        <b-card-text>
          {{ tooltipText[kind] }}
        </b-card-text>
      </b-card>
    </transition>
  </b-tooltip>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },

    kind: {
      type: String,
      required: true
    },

    img: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      show: false,

      tooltipText: {
        swimlane: 'Visually group steps',
        trigger: 'Trigger the workflow execution based on configuration',
        termination: 'Terminate workflow execution',
        expressions: 'Define and mutate scope variables',
        function: 'Execute the chosen predefined function',
        iterator: 'Iterate over items',
        break: 'Stop iterator execution and continue with workflow',
        continue: 'Stop current iteration and continue with the next one',
        'error-handler': 'Continue workflow from this step if an error is triggered',
        error: 'Throws error and stops workflow execution, also prevents saving of records triggered with before trigger',
        gatewayExclusive: 'Workflow execution can continue on first path that fits condition',
        gatewayInclusive: 'Workflow execution can continue on all paths that fit condition',
        gatewayParallel: 'Splits workflow execution into two parralel paths or merges multiple paths into one'
      }
    }
  }
}
</script>

<style lang="scss">
.tooltip.b-tooltip-light > .tooltip-inner {
  padding: 0;
  max-width: 20rem;
  min-width: 20rem;
  margin-left: 0.15rem;
  background-color: transparent;
  opacity: 1;
}

.tooltip.b-tooltip {
  opacity: 1;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .3s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
