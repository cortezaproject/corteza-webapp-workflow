<template>
  <workflow-editor
    :model="model"
    @save="saveModel"
  />
</template>

<script>
import WorkflowEditor from '../../components/WorkflowEditor'

export default {
  name: 'Editor',

  components: {
    WorkflowEditor,
  },

  data () {
    return {
      model: undefined,
    }
  },

  mounted () {
    this.getModel()
  },

  methods: {
    getModel () {
      this.model = JSON.parse(localStorage.getItem('graph'))
    },

    saveModel (model) {
      localStorage.setItem('graph', model)
    },
  }
}
</script>

<style>

</style>