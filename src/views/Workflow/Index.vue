<template>
  <div class="h-100 py-3 flex-grow-1 overflow-auto">
    <b-container>
      <b-row no-gutters>
        <b-col xl="8" offset-xl="2">
        </b-col>
      </b-row>
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
                v-if="newWorkflow && canCreate"
                variant="primary"
                size="lg"
                class="mr-1"
                @click="createWorkflow"
              >
                New Workflow
              </b-button>

              <c-permissions-button
                v-if="canGrant"
                resource="automation:workflow:*"
                buttonLabel="Permissions"
                buttonVariant="light"
                class="btn-lg"
              />
            </div>

            <div class="flex-grow-1 mt-1">
              <b-input
                v-model.trim="query"
                class="mw-100"
                type="search"
                placeholder="Type here to search all workflows..." />

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
    </b-container>
  </div>
</template>

<script>
import { automation } from '@cortezaproject/corteza-js'

export default {
  name: 'WorkflowList',

  data () {
    return {
      canGrant: false,
      canCreate: false,

      workflows: [],

      query: '',

      sortBy: 'handle',
      sortDesc: false,

      newWorkflow: {},
    }
  },

  computed: {
    userID () {
      if (this.$auth.user) {
        return this.$auth.user.userID
      }
      return undefined
    },

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
  },

  created () {
    this.fetchPermissions()
    this.fetchWorkflows()
  },

  methods: {
    fetchPermissions () {
      this.$AutomationAPI.permissionsEffective()
        .then(rules => {
          this.canGrant = rules.find(({ resource, operation, allow }) => resource === 'automation' && operation === 'grant').allow
          this.canCreate = rules.find(({ resource, operation, allow }) => resource === 'automation' && operation === 'workflow.create').allow
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

    createWorkflow () {
      this.newWorkflow = new automation.Workflow({
        ownedBy: this.userID,
        runAs: '0',
        enabled: true,
        handle: 'Handle',
        meta: {
          name: 'Unnamed Workflow',
        },
      })

      this.$AutomationAPI.workflowCreate(this.newWorkflow)
        .then(wf => this.openWorkflowEditor(wf))
        .catch(this.defaultErrorHandler('Failed to create workflow'))
    },

    handleRowClicked (workflow) {
      this.$router.push({ name: 'workflow.edit', params: { workflowID: workflow.workflowID } })
    },

    openWorkflowEditor (workflow) {
      const { workflowID } = workflow
      this.$router.push({ name: 'workflow.edit', params: { workflowID } })
    },
  },
}
</script>
