<template>
  <b-container
    fluid
    class="h-100 m-0 p-0"
  >
    <graph-editor />
  </b-container>
</template>

<script>
import GraphEditor from './components/GraphEditor'

export default {
  components: {
    GraphEditor,
  },

  data () {
    return {
    }
  },
}
</script>

<style>
html {
  height: 100vh;
}

body {
  height: 100%;
}
</style>
