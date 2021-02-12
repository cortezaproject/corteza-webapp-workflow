<template>
  <div>
    <b-form
      class="p-2 shadow-sm"
    >
      <b-form-group
        label="Resource*"
      >
        <b-form-select
          v-model="item.triggers.resourceType"
          :options="resourceTypeOptions"
        />
      </b-form-group>

      <b-form-group
        v-if="item.triggers.resourceType"
        label="Event*"
      >
        <b-form-select
          v-model="item.triggers.eventType"
          :options="eventTypeOptions"
        />
      </b-form-group>

      <b-form-group>
      <b-form-checkbox
          v-model="item.triggers.enabled"
        >
          Enabled
        </b-form-checkbox>
      </b-form-group>
    </b-form>

    <b-card
      no-body
      class="w-100 h-100 border-top border-left-0 border-right-0 border-bottom-0 shadow-sm mt-3"
    >
      <b-card-header
        class="sticky-top h5 px-2"
        header-bg-variant="white"
        header-text-variant="primary"
      >
        <div
          class="d-flex"
        >
          Constraints
          <b-button
            variant="link"
            class="align-top border-0 p-0 ml-auto"
            @click="addConstraint()"
          >
            + Add
          </b-button>
        </div>
      </b-card-header>

      <b-card-body
        class="p-0 border-top border-primary"
      >
        <b-table
          id="constraints"
          outlined
          fixed
          head-variant="light"
          class="mb-0 border-left-0"
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
            >
              <b-form-select
                v-model="c.name"
                :options="constraintNameTypes"
              />
            </b-form-group>

            <b-form-group
              label="Operator"
            >
              <b-form-select
                v-model="c.op"
                :options="constraintOperatorTypes"
              />
            </b-form-group>

            <b-form-group>
              <template #label>
                <div
                  class="d-flex"
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
      no-body
      class="w-100 h-100 border-top border-left-0 border-right-0 border-bottom-0 shadow-sm mt-3"
    >
      <b-card-header
        class="sticky-top h5 px-2"
        header-bg-variant="white"
        header-text-variant="primary"
      >
        Initial scope
      </b-card-header>

      <b-card-body
        class="p-0 border-top border-primary"
      >
        <b-table
          id="variable"
          outlined
          fixed
          head-variant="light"
          class="mb-0 border-left-0"
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
    }
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
          tdClass: 'border-top text-truncate pointer'
        },
        {
          key: 'op',
          label: 'Operator',
          class: 'text-center',
          tdClass: 'border-top text-truncate pointer'
        },
        {
          key: 'values',
          class: 'text-right',
          tdClass: 'border-top text-truncate pointer'
        },
      ]
    },

    scopeFields () {
      return [
        {
          key: 'name',
          tdClass: 'border-top text-truncate'
        },
        {
          key: 'type',
          class: 'text-center',
          tdClass: 'border-top text-truncate'
        },
        {
          key: 'immutable',
          class: 'text-right',
          tdClass: 'border-top text-truncate'
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
    },

    removeConstraint (index) {
      this.item.triggers.constraints.splice(index, 1)
    }
  }
}
</script>
