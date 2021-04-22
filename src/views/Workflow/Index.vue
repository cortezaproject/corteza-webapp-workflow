<template>
  <div class="h-100 py-3 flex-grow-1 overflow-auto">
    <b-container fluid>
      <b-row no-gutters>
        <b-col
          xl="8"
          offset-xl="2"
        >
          <b-card
            no-body
            class="shadow-sm"
          >
            <b-card-header
              header-bg-variant="white"
              class="py-3"
            >
              <h1 class="mb-3">
                List of Workflows
              </h1>

              <b-row
                class="align-items-center justify-content-between"
                no-gutters
              >
                <div class="text-nowrap flex-grow-1">
                  <b-button
                    v-if="canCreate"
                    variant="primary"
                    size="lg"
                    :to="{ name: 'workflow.create' }"
                  >
                    New Workflow
                  </b-button>

                  <import
                    v-if="canCreate"
                    :disabled="importProcessing"
                    class="d-inline-block ml-1"
                    @import="importJSON"
                  />

                  <export
                    :workflows="workflowIDs"
                    class="ml-1"
                  />

                  <c-permissions-button
                    v-if="canGrant"
                    resource="automation:workflow:*"
                    button-label="Permissions"
                    button-variant="light"
                    class="btn-lg ml-1"
                  />
                </div>

                <div class="flex-grow-1 mt-1">
                  <b-input
                    v-model.trim="query"
                    class="mw-100"
                    type="search"
                    placeholder="Type here to search all workflows..."
                  />
                </div>
              </b-row>
            </b-card-header>

            <b-card-body class="p-0">
              <b-table
                :fields="tableFields"
                :items="workflows"
                :filter="query"
                :filter-included-fields="['handle']"
                filter-debounce="300"
                :sort-by.sync="sortBy"
                :sort-desc="sortDesc"
                head-variant="light"
                tbody-tr-class="pointer"
                responsive
                hover
                @row-clicked="handleRowClicked"
              >
                <template v-slot:cell(handle)="{ item: w }">
                  {{ w.meta.name || w.handle }}
                </template>
                <template v-slot:cell(enabled)="{ item: w }">
                  <font-awesome-icon
                    :icon="['fas', w.enabled ? 'check' : 'times']"
                  />
                </template>
                <template v-slot:cell(actions)="{ item: w }">
                  <c-permissions-button
                    v-if="w.canGrant"
                    :title="w.meta.name || w.handle"
                    :target="w.meta.name || w.handle"
                    :resource="`automation:workflow:${w.workflowID}`"
                    link
                    class="btn px-2"
                  />
                </template>
              </b-table>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import Import from '../../components/Import'
import Export from '../../components/Export'

export default {
  name: 'WorkflowList',

  components: {
    Import,
    Export,
  },

  data () {
    return {
      canGrant: false,
      canCreate: false,

      workflows: [],

      query: '',

      sortBy: 'handle',
      sortDesc: false,

      newWorkflow: {},

      importProcessing: false,
    }
  },

  computed: {
    tableFields () {
      return [
        {
          key: 'handle',
          label: 'Name',
          sortable: true,
          tdClass: 'align-middle text-nowrap',
          class: 'pl-4',
        },
        {
          key: 'enabled',
          sortable: true,
          tdClass: 'align-middle',
          class: 'text-center',
        },
        {
          key: 'steps',
          sortable: true,
          sortByFormatted: true,
          tdClass: 'align-middle',
          class: 'text-center',
          formatter: steps => {
            return (steps || []).length
          },
        },
        {
          key: 'updatedAt',
          sortable: true,
          sortByFormatted: true,
          tdClass: 'align-middle',
          class: 'text-right',
          formatter: (updatedAt, key, item) => {
            return new Date(updatedAt || item.createdAt).toLocaleDateString('en-US')
          },
        },
        {
          key: 'actions',
          label: '',
          tdClass: 'text-right text-nowrap',
        },
      ]
    },

    workflowIDs () {
      return this.workflows.map(({ workflowID }) => workflowID)
    },

    userID () {
      if (this.$auth.user) {
        return this.$auth.user.userID
      }
      return undefined
    },
  },

  created () {
    this.fetchPermissions()
    this.fetchWorkflows()
  },

  methods: {
    fetchPermissions () {
      this.$AutomationAPI.permissionsEffective()
        .then(rules => {
          this.canGrant = rules.find(({ resource, operation }) => resource === 'automation' && operation === 'grant').allow
          this.canCreate = rules.find(({ resource, operation }) => resource === 'automation' && operation === 'workflow.create').allow
        })
        .catch(this.defaultErrorHandler('Failed to fetch automation permissions'))
    },

    fetchWorkflows () {
      this.$AutomationAPI.workflowList({ disabled: 1 })
        .then(({ set = [] }) => {
          this.workflows = set
        })
        .catch(this.defaultErrorHandler('Failed to fetch workflows'))
    },

    async importJSON (workflows = []) {
      this.importProcessing = true

      const skippedWorkflows = []

      await Promise.all(workflows.map(({ triggers, ...wf }) => {
        // Create workflow
        return this.$AutomationAPI.workflowCreate({ ownedBy: this.userID, runAs: '0', ...wf })
          .then(({ workflowID }) => {
            // Create triggers
            return Promise.all(triggers.map(trigger => {
              return this.$AutomationAPI.triggerCreate({
                ...trigger,
                workflowID,
                workflowStepID: trigger.stepID,
                ownedBy: this.userID,
              })
            }))
          })
          .catch(() => {
            // Skip workflow and add to skipped list
            if (wf.handle) {
              skippedWorkflows.push(wf.handle)
            }
          })
      }))
        .then(() => {
          if (skippedWorkflows.length) {
            this.raiseInfoAlert(`Skipped workflows: ${skippedWorkflows.join(', ')}`)
          } else {
            this.raiseSuccessAlert('Workflows imported')
          }
        })
        .catch(this.defaultErrorHandler('Failed to import'))

      await this.fetchWorkflows()

      this.importProcessing = false
    },

    handleRowClicked (workflow) {
      this.$router.push({ name: 'workflow.edit', params: { workflowID: workflow.workflowID } })
    },
  },
}
</script>
