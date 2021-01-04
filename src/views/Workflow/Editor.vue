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

  async created () {
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

    saveWorkflow (workflow) {
      console.log(workflow)
      if (this.workflow.workflowID) {
        this.workflow.steps = workflow
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