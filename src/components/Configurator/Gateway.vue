<template>
  <div
    class="p-2"
  >
    <div
      v-if="['incl', 'excl'].includes(gatewayKind)"
    >
      <var
        v-if="!gatewayEdges.length"
      >
        Gateway must be source of at least two paths
      </var>

      <b-form-group
        v-for="edge in gatewayEdges"
        :key="edge.id"
        :label="edge.value"
      >
        <b-form-input
          v-model="edge.expr"
          placeholder="Condition"
          @input="updateEdge(edge.id, $event)"
        />
      </b-form-group>
    </div>
  </div>
</template>

<script>
import base from './base'

export default {
  extends: base,

  computed: {
    gatewayKind () {
      return this.item.config.ref
    },

    gatewayEdges () {
      const edges = []
      if (['incl', 'excl'].includes(this.gatewayKind)) {
        if (this.item.node.edges) {
          this.item.node.edges.forEach(({ id, source, target, value = '' }) => {
            if (source.id === this.item.node.id) {
              edges.push({
                id,
                source: source.id,
                target: target.id,
                value,
                expr: this.edges[id].config.expr || ''
              })
            }
          })
        }
      }
      return edges
    }
  },

  methods: {
    updateEdge (id, expr) {
      this.edges[id].config.expr = expr
      this.$root.$emit('change-detected')
    }
  }
}
</script>
