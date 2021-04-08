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
            @change="resourceChanged()"
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
            @change="eventChanged()"
          />
        </b-form-group>

        <b-form-group
          class="mb-0"
        >
          <b-form-checkbox
            v-model="item.triggers.enabled"
            class="text-primary"
            @change="enabledChanged()"
          >
            Enabled
          </b-form-checkbox>
        </b-form-group>
      </b-card-body>
    </b-card>

    <b-card
      v-if="showConstraints"
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
          v-if="constraintNameTypes.length > 1"
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
          v-if="constraintNameTypes.length > 1"
          id="constraints"
          fixed
          borderless
          hover
          head-row-variant="secondary"
          details-td-class="bg-white"
          :items="item.triggers.constraints"
          :fields="constraintFields"
          :tbody-tr-class="rowClass"
          @row-clicked="item=>$set(item, '_showDetails', !item._showDetails)"
        >
          <template #cell(name)="{ item: c }">
            <samp v-if="c.name">
              {{ c.name.split('.').map(s => {
                return s[0].toUpperCase() + s.slice(1).toLowerCase()
              }).join(' ')
              }}
            </samp>
          </template>

          <template #cell(values)="{ item: c, index }">
            <div
              class="text-truncate"
              :class="{ 'w-75': c._showDetails}"
            >
              <samp>{{ c.values.join(' or ') }}</samp>
            </div>

            <b-button
              v-if="c._showDetails"
              variant="outline-danger"
              class="position-absolute trash border-0"
              @click="removeConstraint(index)"
            >
              <font-awesome-icon
                :icon="['far', 'trash-alt']"
              />
            </b-button>
          </template>

          <template #row-details="{ item: c }">
            <div class="arrow-up" />
            <b-card
              class="bg-light"
            >
              <b-form-group
                label="Resource"
                label-class="text-primary"
              >
                <b-form-select
                  v-model="c.name"
                  :options="constraintNameTypes"
                  @change="$root.$emit('change-detected')"
                />
              </b-form-group>

              <b-form-group
                label="Operator"
                label-class="text-primary"
              >
                <b-form-select
                  v-model="c.op"
                  :options="constraintOperatorTypes"
                  @change="$root.$emit('change-detected')"
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
                    @change="$root.$emit('change-detected')"
                  />

                  <b-button
                    variant="outline-danger"
                    class="ml-1 border-0"
                    @click="c.values.splice(index, 1)"
                  >
                    <font-awesome-icon
                      :icon="['far', 'trash-alt']"
                    />
                  </b-button>
                </b-input-group>
              </b-form-group>
            </b-card>
          </template>
        </b-table>

        <b-form-group
          v-else
          :label="item.triggers.eventType.replace('on', '')"
          label-class="text-primary"
          class="mt-0 mb-4 mx-4"
        >
          <b-form-input
            v-model="getDefaultConstraint"
            @change="$root.$emit('change-detected')"
          />
        </b-form-group>
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

  computed: {
    resourceTypeOptions () {
      return [
        { value: null, text: 'Select resource type', disabled: true },
        ...this.resourceTypes,
      ]
    },

    eventTypeOptions () {
      return [
        { value: null, text: 'Select event type', disabled: true },
        ...this.eventTypes.filter(({ resourceType }) => resourceType === this.item.triggers.resourceType)
          .map(({ eventType }) => eventType),
      ]
    },

    eventType () {
      return this.eventTypes.find(({ resourceType, eventType }) => resourceType === this.item.triggers.resourceType && eventType === this.item.triggers.eventType) || {}
    },

    showConstraints () {
      if (this.item.triggers.resourceType && this.item.triggers.eventType) {
        return this.constraintNameTypes.length > 1 ? true : this.item.triggers.eventType !== 'onManual'
      }
      return false
    },

    constraintFields () {
      return [
        {
          key: 'name',
          thClass: 'pl-3 py-2 w-auto',
          tdClass: 'pr-0 text-truncate pointer',
        },
        {
          key: 'op',
          label: 'Operator',
          thClass: 'py-2 operator text-center',
          tdClass: 'pl-0 text-truncate text-center pointer',
        },
        {
          key: 'values',
          thClass: 'pr-3 py-2 w-auto text-center',
          tdClass: 'position-relative pointer text-center',
        },
      ]
    },

    scopeFields () {
      return [
        {
          key: 'name',
          thClass: 'pl-3 py-2',
          tdClass: 'text-truncate',
        },
        {
          key: 'type',
          thClass: 'pr-3 py-2',
          tdClass: 'text-truncate',
        },
      ]
    },

    constraintNameTypes () {
      const constraints = this.eventType.constraints || []

      return [
        { value: null, text: 'Select constraint type', disabled: true },
        ...constraints.reduce((cons, { name }) => {
          if (!name.includes('*')) {
            cons.push({
              value: name,
              text: name.split('.').map(s => {
                return s[0].toUpperCase() + s.slice(1).toLowerCase()
              }).join(' '),
            })
          }

          return cons
        }, []),
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

    getDefaultConstraint: {
      get () {
        if (this.item.triggers.constraints.values) {
          return this.item.triggers.constraints.values[0]
        }
        return ''
      },

      set (constraint) {
        if (this.item.triggers.constraints.values.length) {
          return this.item.triggers.constraints.values[0]
        } else {
          this.item.triggers.constraints = [{
            values: [constraint],
          }]
        }
      },
    },
  },

  async created () {
    if (!this.item.triggers) {
      this.$set(this.item, 'triggers', {
        resourceType: null,
        eventType: null,
        constraints: [],
        enabled: true,
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
          this.resourceTypes = [...resourceTypes].map(resourceType => {
            return {
              value: resourceType,
              text: resourceType.split(':').map(s => {
                return s[0].toUpperCase() + s.slice(1).toLowerCase()
              }).join(' '),
            }
          })
        })
        .catch(this.defaultErrorHandler('Failed to fetch event types'))
    },

    addConstraint () {
      this.item.triggers.constraints.push({
        name: null,
        op: '=',
        values: [''],
        _showDetails: true,
      })

      this.$root.$emit('change-detected')
    },

    removeConstraint (index) {
      this.item.triggers.constraints.splice(index, 1)
      this.$root.$emit('change-detected')
    },

    resourceChanged () {
      this.item.triggers.eventType = null
      this.item.triggers.constraints = []
      this.$root.$emit('change-detected')
    },

    eventChanged () {
      this.item.triggers.constraints = []
      this.addConstraint()
      this.$root.$emit('change-detected')
    },

    enabledChanged () {
      this.$root.$emit('trigger-updated', this.item.node)
      this.$root.$emit('change-detected')
    },

    rowClass (item, type) {
      if (type === 'row') {
        return item._showDetails ? 'border-thick' : 'border-thick-transparent'
      } else if (type === 'row-details') {
        return ''
      }
    },
  },
}
</script>

<style lang="scss">
.border-thick {
  border-left: 4px solid #A7D0E3;
}

.border-thick-transparent {
  border-left: 4px solid transparent;
}

tr.b-table-details > td {
  padding-top: 0;
}

.operator {
  width: 100px;
}
</style>

<style lang="scss" scoped>
.trash {
  right: 0;
  left: 1;
  top: 0;
  bottom: 0;
}

.arrow-up {
  width: 0;
  height: 0;
  margin: 0 auto;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid $light;
}
</style>
