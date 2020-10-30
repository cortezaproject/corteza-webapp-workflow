<template>
  <div
    class="h-100 d-flex flex-row px-1 py-2"
  >
    <b-card
      header="Tools"
      style="max-width: 100px;"
      body-class="p-1"
    >
      <div
        id="toolbar"
        ref="toolbar"
      />
      <b-button
        variant="link"
        @click="toJSON()"
      >
        To JSON
      </b-button>
    </b-card>
    <b-card-body
      id="graph"
      ref='graph'
      class="card h-100 flex-grow-1 ml-1 p-0"
    />
  </div>
</template>

<script>
import GraphX from '../lib/graph'

export default {
  name: 'graph-wrapper',

  data () {
    return {
      graph: undefined
    }
  },

  mounted () {
    this.graph = new GraphX(this.$refs.graph, this.$refs.toolbar)
    let dataModel = JSON.parse(localStorage.getItem('graph'))
    this.$refs.graph.style.background = `url("${require('../assets/grid.gif')}")`

    this.graph.render(dataModel)
  },

  methods: {
    toJSON () {
      localStorage.setItem('graph', this.graph.getJsonModel())
    }
  }
}
</script>
