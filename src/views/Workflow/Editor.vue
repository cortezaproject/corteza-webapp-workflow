<template>
  <workflow-editor
    v-if="workflow"
    :workflow="workflow"
    @save="saveWorkflow"
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
      workflow: {},
    }
  },

  computed: {
    workflowID () {
      return this.$route.params.workflowID
    }
  },

  async mounted () {
    await this.fetchWorkflow()
  },

  methods: {
    fetchWorkflow () {
      if (this.workflowID) {
        this.$AutomationAPI.workflowRead({ workflowID: this.workflowID })
          .then(wf => this.workflow = wf)
          .catch(err => console.error(err))
      }
    },

    saveWorkflow ({ steps = [], paths = [] }) {
      if (this.workflow.workflowID) {
        this.workflow.steps = steps
        this.workflow.paths = paths

        this.$AutomationAPI.workflowUpdate(this.workflow)
          .then(wf => this.workflow = wf)
          .catch(err => console.error(err))
      }
    }
  }
}
</script>

<style>

</style>