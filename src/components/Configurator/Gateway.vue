<template>
  <div>
    <div
      v-if="!gatewayEdges.length"
    >
      Connect two paths to configure gateway
    </div>

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
</template>

<script>
import base from './base'

export default {
  extends: base,

  computed: {
    gatewayEdges () {
      const edges = []
      if (this.item.config.ref === 'excl') {
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
    }
  }
}
</script>
