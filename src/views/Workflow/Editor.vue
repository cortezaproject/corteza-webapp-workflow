<template>
  <workflow-editor
    v-if="!processing"
    :workflow-object="workflow"
    :workflow-triggers="triggers"
    :change-detected="changeDetected"
    :can-create="canCreate"
    @save="saveWorkflow"
    @delete="deleteWorkflow"
  />
</template>

<script>
import WorkflowEditor from '../../components/WorkflowEditor'
import { automation } from '@cortezaproject/corteza-js'

export default {
  name: 'Editor',

  components: {
    WorkflowEditor,
  },

  data () {
    return {
      canCreate: false,

      processing: true,
      workflow: {},
      triggers: [],

      changeDetected: false,
    }
  },

  computed: {
    workflowID () {
      return this.$route.params.workflowID || (this.workflow.workflowID !== '0' ? this.workflow.workflowID : undefined)
    },

    userID () {
      if (this.$auth.user) {
        return this.$auth.user.userID
      }
      return undefined
    },
  },

  async mounted () {
    window.onbeforeunload = null

    this.$root.$on('change-detected', () => {
      if (!this.changeDetected) {
        window.onbeforeunload = () => {
          return true
        }
      }

      this.changeDetected = true
    })

    this.fetchPermissions()

    if (this.workflowID) {
      await this.fetchTriggers()
      await this.fetchWorkflow()
    } else {
      this.workflow = new automation.Workflow({
        ownedBy: this.userID,
        runAs: '0',
        enabled: true,
        handle: '',
        meta: {
          name: 'Unnamed Workflow',
        },
      })
    }

    this.processing = false
  },

  beforeRouteLeave (to, from, next) {
    if (this.changeDetected) {
      next(window.confirm('You have unsaved changes, are you sure you want to exit?'))
    } else {
      window.onbeforeunload = null
      next()
    }
  },

  beforeDestroy () {
    window.onbeforeunload = null
  },

  methods: {
    async fetchWorkflow () {
      return this.$AutomationAPI.workflowRead({ workflowID: this.workflowID })
        .then(wf => {
          this.workflow = wf
        })
        .catch(this.defaultErrorHandler('Failed to fetch workflow'))
    },

    async fetchTriggers (workflowID = this.workflowID) {
      return this.$AutomationAPI.triggerList({ workflowID, disabled: 1 })
        .then(({ set = [] }) => {
          this.triggers = set
        })
        .catch(this.defaultErrorHandler('Failed to fetch triggers'))
    },

    fetchPermissions () {
      this.$AutomationAPI.permissionsEffective()
        .then(rules => {
          this.canCreate = rules.find(({ resource, operation }) => resource === 'automation' && operation === 'workflow.create').allow
        })
        .catch(this.defaultErrorHandler('Failed to fetch automation permissions'))
    },

    async saveWorkflow (wf) {
      try {
        this.workflow = wf
        const isNew = !this.workflowID

        const { steps = [], paths = [], triggers = [] } = this.workflow

        this.workflow.steps = steps
        this.workflow.paths = paths

        if (isNew) {
          // Create workflow
          if (!this.canCreate) {
            throw new Error('Not allowed to create workflow')
          }

          wf = await this.$AutomationAPI.workflowCreate(this.workflow)
        } else {
          if (!this.workflow.canUpdateWorkflow) {
            throw new Error('Not allowed to update workflow')
          }

          wf = await this.$AutomationAPI.workflowUpdate(this.workflow)
        }

        // Delete triggers of steps that were deleted
        await Promise.all(this.triggers.filter(({ triggerID }) => {
          return !triggers.find(t => triggerID === t.triggerID)
        }).map(({ triggerID }) => {
          return this.$AutomationAPI.triggerDelete({ triggerID })
        }),
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
                workflowID: wf.workflowID,
                workflowStepID: t.stepID,
                ownedBy: this.userID,
              })
            }
          })).catch(() => {
            throw new Error('Make sure all trigger steps are properly configured')
          })

          await this.fetchTriggers(wf.workflowID)

          this.changeDetected = false
          window.onbeforeunload = null

          this.workflow = wf
          this.raiseSuccessAlert('Workflow updated')

          if (isNew) {
            // Redirect to edit route if new
            this.$router.push({ name: 'workflow.edit', params: { workflowID: this.workflow.workflowID } })
          }
        })
      } catch (e) {
        this.defaultErrorHandler('Save failed')(e)
      }
    },

    deleteWorkflow () {
      if (this.workflow.workflowID) {
        this.$AutomationAPI.workflowDelete(this.workflow)
          .then(() => {
            // Disable unsaved changes prompt
            this.workflow = {}
            this.$router.push({ name: 'workflow.list' })

            this.raiseSuccessAlert('Workflow deleted')
          })
          .catch(this.defaultErrorHandler('Failed to delete workflow'))
      }
    },
  },
}
</script>
