<template>
  <div class="py-3">
    <b-container>
      <b-card
        class="mb-2"
      >
        <b-row
          class="justify-content-between"
        >
          <b-col
            md="5"
          >
            <b-form
              v-if="newWorkflow"
              @submit.prevent="createWorkflow"
            >
              <b-form-group label="Create Workflow">
                <b-input-group>
                  <b-input
                    id="name"
                    v-model="newWorkflow.meta.name"
                    type="text"
                    required
                    placeholder="Workflow name"
                  />
                  <b-input-group-append>
                    <b-button
                      type="submit"
                      variant="dark"
                    >
                      Create
                    </b-button>
                  </b-input-group-append>
                </b-input-group>
              </b-form-group>
            </b-form>
          </b-col>

          <b-col
            md="2"
            class="d-flex justify-content-end"
          >
            <c-permissions-button
              v-if="canGrant"
              resource="automation:workflow:*"
              link
            />
          </b-col>
        </b-row>
      </b-card>
      <b-card
        title="Workflow List"
      >
        <b-table
          :fields="tableFields"
          :items="workflows"
          striped
          borderless
          responsive
        >

          <template v-slot:cell(label)="{ item: w }">
            {{ w.meta.name || w.handle }}
          </template>
          <template v-slot:cell(enabled)="{ item: w }">
            <font-awesome-icon
              :icon="['fas', w.enabled ? 'check' : 'times']"
            />
          </template>
          <template v-slot:cell(steps)="{ item: w }">
            {{ (w.steps || []).length }}
          </template>
          <template v-slot:cell(updatedAt)="{ item: w }">
            {{ new Date(w.updatedAt || w.createdAt).toLocaleDateString('en-US') }}
          </template>
          <template v-slot:cell(actions)="{ item: w }">
            <span>
              <router-link
                :to="{name: 'workflow.edit', params: { workflowID: w.workflowID }}"
                class="text-dark"
              >
                <font-awesome-icon
                  :icon="['far', 'edit']"
                />
              </router-link>
            </span>
            <c-permissions-button
              v-if="w.canGrant"
              :title="w.meta.name || w.handle"
              :target="w.meta.name || w.handle"
              :resource="`automation:workflow:${w.workflowID}`"
              link
              class="ml-2"
            />
          </template>
        </b-table>
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

      workflows: [],

      newWorkflow: new automation.Workflow({
        ownedBy: this.userID,
        runAs: this.userID,
        enabled: true,
        meta: {
          name: '',
        },
      }),
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
        },
        {
          key: 'enabled',
          sortable: true,
          class: 'text-center',
        },
        {
          key: 'steps',
          sortable: true,
          class: 'text-center',
        },
        {
          key: 'updatedAt',
          sortable: true,
          class: 'text-right',
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
        })
        .catch(this.defaultErrorHandler('Failed to fetch automation permissions'))
    },

    fetchWorkflows () {
      this.$AutomationAPI.workflowList({ disabled: 1 })
        .then(({ set = [], filter = {} }) => {
          this.workflows = set
        })
        .catch(this.defaultErrorHandler('Failed to fetch workflows'))
    },

    createWorkflow () {
      this.newWorkflow.handle = this.newWorkflow.meta.name.trim(' ').split(' ').map(s => {
        return s[0].toUpperCase() + s.slice(1).toLowerCase()
      }).join('')

      this.$AutomationAPI.workflowCreate(this.newWorkflow)
        .then(wf => this.openWorkflowEditor(wf))
        .catch(this.defaultErrorHandler('Failed to create workflow'))
    },

    openWorkflowEditor (workflow) {
      const { workflowID } = workflow
      this.$router.push({ name: 'workflow.edit', params: { workflowID } })
    },
  },
}
</script>
<style lang="scss" scoped>
table {
  tr {
    cursor: pointer;
  }
}
</style>
