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
              v-if="true"
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

          <template v-slot:cell(label)="{ item: m }">
            {{ m.meta.name || m.handle }}
          </template>
          <template v-slot:cell(enabled)="{ item: m }">
            <font-awesome-icon
              :icon="['fas', m.enabled ? 'check' : 'times']"
            />
          </template>
          <template v-slot:cell(steps)="{ item: m }">
            {{ (m.steps || []).length }}
          </template>
          <template v-slot:cell(updatedAt)="{ item: m }">
            {{ new Date(m.updatedAt || m.createdAt).toLocaleDateString('en-US') }}
          </template>
          <template v-slot:cell(actions)="{ item: m }">
            <span>
              <router-link
                :to="{name: 'workflow.edit', params: { workflowID: m.workflowID }}"
                class="mr-2 text-dark"
              >
                <font-awesome-icon
                  :icon="['far', 'edit']"
                />
              </router-link>
            </span>
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
          key: 'label',
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
    this.fetchWorkflows()
  },

  methods: {
    fetchWorkflows () {
      this.$AutomationAPI.workflowList({ disabled: 1 })
        .then(({ set = [], filter = {} }) => {
          this.workflows = set
        })
        .catch(err => console.error(err))
    },

    createWorkflow () {
      this.newWorkflow.handle = this.newWorkflow.meta.name.trim(' ').split(' ').map(s => {
        return string[0].toUpperCase() + string.slice(1).toLowerCase()
      }).join('')

      this.$AutomationAPI.workflowCreate(this.newWorkflow)
        .then(wf => this.openWorkflowEditor(wf))
        .catch(err => console.error(err))
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
