<template>
  <workflow-editor
    v-if="!processing"
    :workflow="workflow"
    :triggers="triggers"
    @save="saveWorkflow"
    @delete="deleteWorkflow"
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
      processing: true,
      workflow: {},
      triggers: [],
    }
  },

  computed: {
    workflowID () {
      return this.$route.params.workflowID
    },

    userID () {
      if (this.$auth.user) {
        return this.$auth.user.userID
      }
      return undefined
    },
  },

  async mounted () {
    await this.fetchWorkflow()
    await this.fetchTriggers()

    this.processing = false
  },

  methods: {
    async fetchWorkflow () {
      if (this.workflowID) {
        return this.$AutomationAPI.workflowRead({ workflowID: this.workflowID })
          .then(wf => this.workflow = wf)
          .catch(err => console.error(err))
      }
    },

    async fetchTriggers () {
      return this.$AutomationAPI.triggerList({ workflowID: this.workflowID })
        .then(({ set = [] }) => this.triggers = set)
        .catch(err => console.error(err))
    },

    async saveWorkflow ({ steps = [], paths = [], triggers = [] }) {
      if (this.workflow.workflowID) {
        this.workflow.steps = steps
        this.workflow.paths = paths

        // Delete triggers of steps that were deleted
        await Promise.all(this.triggers.filter(({ triggerID }) => {
            return !triggers.find(t => triggerID === t.triggerID)
          }).map(({ triggerID }) => {
            return this.$AutomationAPI.triggerDelete({ triggerID })
          })
        )

        await Promise.all(triggers.map(t => {
          // Update triggers that already have an ID
          if (t.triggerID) {
            return this.$AutomationAPI.triggerUpdate({
              ...t,
              workflowStepID: t.stepID,
            })
          } else {
            // Create the other triggers
            return this.$AutomationAPI.triggerCreate({
              ...t,
              workflowID: this.workflow.workflowID,
              workflowStepID: t.stepID,
              ownedBy: this.userID,
            })
          }
        }))

        this.$AutomationAPI.workflowUpdate(this.workflow)
          .then(wf => this.workflow = wf)
          .catch(err => console.error(err))

        await this.fetchTriggers()
      }
    },

    deleteWorkflow () {
      if (this.workflow.workflowID) {
        this.$AutomationAPI.workflowDelete(this.workflow)
          .then(() => {
            this.$router.push({ name: 'workflow.list' })
          })
          .catch(err => console.error(err))
      }
    }
  }
}
</script>
