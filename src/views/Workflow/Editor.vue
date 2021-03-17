<template>
  <workflow-editor
    v-if="!processing"
    :workflow="workflow"
    :triggers="triggers"
    :change-detected="changeDetected"
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

      changeDetected: false,
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
    this.$root.$on('change-detected', () => {
      this.changeDetected = true
    })

    await this.fetchTriggers()
    await this.fetchWorkflow()

    this.processing = false
  },

  methods: {
    async fetchWorkflow () {
      if (this.workflowID) {
        return this.$AutomationAPI.workflowRead({ workflowID: this.workflowID })
          .then(wf => this.workflow = wf)
          .catch(this.defaultErrorHandler('Failed to fetch workflow'))
      }
    },

    async fetchTriggers () {
      return this.$AutomationAPI.triggerList({ workflowID: this.workflowID, disabled: 1 })
        .then(({ set = [] }) => this.triggers = set)
        .catch(this.defaultErrorHandler('Failed to fetch triggers'))
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
        ).then(async () => {
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
          })).catch(() => {
            throw new Error('Make sure all trigger steps are properly configured')
          })

          this.workflow.handle = this.workflow.meta.name.trim(' ').split(' ').map(s => {
            return s[0].toUpperCase() + s.slice(1).toLowerCase()
          }).join('')

          const wf = await this.$AutomationAPI.workflowUpdate(this.workflow)

          await this.fetchTriggers()
          this.changeDetected = false
          this.workflow = wf
          this.raiseSuccessAlert('Workflow updated')
        }).catch(this.defaultErrorHandler('Failed to save workflow'))
      }
    },

    deleteWorkflow () {
      if (this.workflow.workflowID) {
        this.$AutomationAPI.workflowDelete(this.workflow)
          .then(() => {
            this.$router.push({ name: 'workflow.list' })

            this.raiseSuccessAlert('Workflow deleted')
          })
          .catch(this.defaultErrorHandler('Failed to delete workflow'))
      }
    }
  }
}
</script>
