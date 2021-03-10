<template>
  <div>
    <b-card
      class="flex-grow-1 border-bottom border-light rounded-0"
    >
      <b-card-header
        header-tag="header"
        class="bg-white p-0 mb-3"
      >
        <h5
          class="mb-0"
        >
          Configuration
        </h5>
      </b-card-header>
      <b-card-body
        class="p-0"
      >
        <b-form-group
          label="Resource*"
          label-class="text-primary"
        >
          <b-form-select
            v-model="item.triggers.resourceType"
            :options="resourceTypeOptions"
            @input="$root.$emit('change-detected')"
          />
        </b-form-group>

        <b-form-group
          v-if="item.triggers.resourceType"
          label-class="text-primary"
          label="Event*"
        >
          <b-form-select
            v-model="item.triggers.eventType"
            :options="eventTypeOptions"
            @input="$root.$emit('change-detected')"
          />
        </b-form-group>

        <b-form-group
          class="mb-0"
        >
          <b-form-checkbox
            v-model="item.triggers.enabled"
            class="text-primary"
            @input="$root.$emit('change-detected')"
          >
            Enabled
          </b-form-checkbox>
        </b-form-group>
      </b-card-body>
    </b-card>

    <b-card
      v-if="item.triggers.resourceType && item.triggers.eventType"
      class="flex-grow-1 border-bottom border-light rounded-0"
      body-class="p-0"
    >
      <b-card-header
        header-tag="header"
        class="d-flex align-items-center bg-white p-4"
      >
        <h5
          class="mb-0"
        >
          Constraints
        </h5>
        <b-button
          variant="primary"
          class="align-top border-0 ml-3"
          @click="addConstraint()"
        >
          + Add Constraints
        </b-button>
      </b-card-header>
      <b-card-body
        class="p-0"
      >
        <b-table
          id="constraints"
          fixed
          borderless
          head-row-variant="secondary"
          class="mb-4"
          :items="this.item.triggers.constraints"
          :fields="constraintFields"
          @row-clicked="item=>$set(item, '_showDetails', !item._showDetails)"
        >
          <template #cell(name)="{ item: c }">
            <samp>{{ c.name[0].toUpperCase() + c.name.slice(1).toLowerCase() }}</samp>
          </template>
          <template #cell(values)="{ item: c }">
            <samp>{{ c.values.join(' or ') }}</samp>
          </template>
           <template #row-details="{ index, item: c }">
            <b-form-group
              label="Resource"
              label-class="text-primary"
            >
              <b-form-select
                v-model="c.name"
                :options="constraintNameTypes"
                @input="$root.$emit('change-detected')"
              />
            </b-form-group>

            <b-form-group
              label="Operator"
              label-class="text-primary"
            >
              <b-form-select
                v-model="c.op"
                :options="constraintOperatorTypes"
                @input="$root.$emit('change-detected')"
              />
            </b-form-group>

            <b-form-group>
              <template #label>
                <div
                  class="d-flex text-primary"
                >
                  Values
                  <b-button
                    variant="link"
                    class="align-top border-0 p-0 ml-2"
                    @click="c.values.push('')"
                  >
                    + Add
                  </b-button>
                </div>
              </template>

              <b-input-group
                v-for="(value, index) in c.values"
                :key="index"
                class="mb-2"
              >
                <b-form-input
                  v-model="c.values[index]"
                  placeholder="Expression"
                  @input="$root.$emit('change-detected')"
                />

                <b-button
                  class="ml-1"
                  variant="outline-danger"
                  @click="c.values.splice(index, 1)"
                >
                  X
                </b-button>
              </b-input-group>
            </b-form-group>

            <div
              class="d-inline-block bg-white w-auto"
            >
              <c-input-confirm
                size="md"
                :borderless="false"
                @confirmed="removeConstraint(index)"
              >
                Remove
              </c-input-confirm>
            </div>
          </template>
        </b-table>
      </b-card-body>
    </b-card>

    <b-card
      v-if="(eventType.properties || []).length"
      class="flex-grow-1 rounded-0"
      body-class="p-0"
    >
      <b-card-header
        header-tag="header"
        class="bg-white p-4"
      >
        <h5
          class="mb-0"
        >
          Initial Scope
        </h5>
      </b-card-header>
      <b-card-body
        class="p-0"
      >
        <b-table
          id="variable"
          fixed
          borderless
          head-row-variant="secondary"
          class="mb-4"
          :items="eventType.properties || []"
          :fields="scopeFields"
        >
          <template #cell(type)="{ item: v }">
            <var>{{ v.type }}</var>
          </template>
        </b-table>
      </b-card-body>
    </b-card>
  </div>
</template>

<script>
import base from './base'

export default {
  extends: base,

  data () {
    return {
      modules: [],

      eventTypes: [],
      resourceTypes: [],
    }
  },

  watch: {
    'item.triggers.resourceType': {
      handler () {
        this.item.triggers.eventType = null
      }
    },

    'item.triggers.enabled': {
      handler () {
        this.$root.$emit('trigger-updated', this.item.node)
      }
    },
  },

  computed: {
    resourceTypeOptions () {
     return [
        { value: null, text: 'Select resource type', disabled: true },
        ...this.resourceTypes
      ]
    },

    eventTypeOptions () {
     return [
        { value: null, text: 'Select event type', disabled: true },
        ...this.eventTypes.filter(({ resourceType }) => resourceType === this.item.triggers.resourceType)
          .map(({ eventType }) => eventType)
      ]
    },

    eventType () {
      return this.eventTypes.find(et => et.resourceType === this.item.triggers.resourceType && et.eventType === this.item.triggers.eventType) || {}
    },

    constraintFields () {
      return [
        {
          key: 'name',
          thClass: "pl-3 py-2",
          tdClass: 'text-truncate pointer'
        },
        {
          key: 'op',
          label: 'Operator',
          thClass: "py-2",
          tdClass: 'text-truncate pointer'
        },
        {
          key: 'values',
          thClass: "pr-3 py-2",
          tdClass: 'text-truncate pointer'
        },
      ]
    },

    scopeFields () {
      return [
        {
          key: 'name',
          thClass: "pl-3 py-2",
          tdClass: 'text-truncate'
        },
        {
          key: 'type',
          thClass: "pl-3 py-2",
          tdClass: 'text-truncate'
        },
        {
          key: 'immutable',
          thClass: "pl-3 py-2",
          tdClass: 'text-truncate'
        },
      ]
    },

    constraintNameTypes () {
     return [
        { value: null, text: 'Select constraint type', disabled: true },
        { value: 'module', text: 'Module' },
      ]
    },

    constraintOperatorTypes () {
      return [
        { value: null, text: 'Operator', disabled: true },
        { value: '=', text: '=' },
        { value: '!=', text: '!=' },
        { value: 'like', text: 'Like' },
        { value: 'not like', text: 'Not like' },

      ]
    },
  },

  async created () {
    if (!this.item.triggers) {
      this.$set(this.item, 'triggers', {
        resourceType: null,
        eventType: null,
        constraints: [],
      })
    }

    await this.getEventTypes()
  },

  methods: {
    async getEventTypes () {
      return this.$AutomationAPI.eventTypesList()
        .then(({ set }) => {
          this.eventTypes = set
          const resourceTypes = new Set(set.map(({ resourceType }) => resourceType))
          this.resourceTypes = [...resourceTypes].map(resourceType  => {
            return { value: resourceType, text: resourceType.split(':').map(s => {
              return s[0].toUpperCase() + s.slice(1).toLowerCase()
            }).join(' ')}
          })
        })
        .catch(this.defaultErrorHandler('Failed to fetch event types'))
    },

    addConstraint () {
      this.item.triggers.constraints.push({
        name: 'module',
        op: '=',
        values: [''],
        _showDetails: true
      })

      this.$root.$emit('change-detected')
    },

    removeConstraint (index) {
      this.item.triggers.constraints.splice(index, 1)
      this.$root.$emit('change-detected')
    }
  }
}
</script>
