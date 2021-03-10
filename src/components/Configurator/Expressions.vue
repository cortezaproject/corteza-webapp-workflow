<template>
  <b-card
    class="flex-grow-1 border-bottom border-light rounded-0"
    body-class="p-0"
  >
      <b-card-header
        header-tag="header"
        class="d-flex align-items-center bg-white py-4"
      >
        <h5
          class="mb-0"
        >
          Expressions
        </h5>
        <b-button
          variant="primary"
          class="align-top border-0 ml-3"
          @click="addArgument()"
        >
          + Add Expression
        </b-button>
      </b-card-header>

    <b-card-body
      v-if="item.config.arguments.length"
      class="p-0 border-top border-primary"
    >
      <b-table
        id="arguments"
        fixed
        borderless
        head-row-variant="secondary"
        class="mb-4"
        :items="item.config.arguments"
        :fields="argumentFields"
        @row-clicked="item=>$set(item, '_showDetails', !item._showDetails)"
      >
        <template #cell(type)="{ item: a }">
          <var>{{ a.type }}</var>
        </template>

        <template #cell(value)="{ item: a }">
          <samp>{{ a.expr }}</samp>
        </template>

        <template #row-details="{ index, item: a }">
          <b-form-group
            label="Target"
            label-class="text-primary"
          >
            <b-form-input
              v-model="a.target"
              placeholder="Target"
              @input="$root.$emit('change-detected')"
            />
          </b-form-group>

          <b-form-group
            label="Type"
            label-class="text-primary"
          >
            <b-form-select
              v-model="a.type"
              :options="fieldTypes"
              @input="$root.$emit('change-detected')"
            />
          </b-form-group>

          <b-form-group
            label="Expression"
            label-class="text-primary"
          >
            <b-form-input
              v-model="a.expr"
              placeholder="Expression"
              @input="$root.$emit('change-detected')"
            />
          </b-form-group>

          <div
            class="d-inline-block bg-white w-auto"
          >
            <c-input-confirm
              size="md"
              :borderless="false"
              @confirmed="removeArgument(index)"
            >
              Remove
            </c-input-confirm>
          </div>
        </template>
      </b-table>
    </b-card-body>
  </b-card>
</template>

<script>
import base from './base'

export default {
  extends: base,

  data () {
    return {
      fieldTypes: []
    }
  },

  computed: {
    argumentFields () {
      return [
        {
          key: 'target',
          thClass: "pl-3 py-2",
          tdClass: 'text-truncate pointer'
        },
        {
          key: 'type',
          thClass: "py-2",
          tdClass: 'text-truncate pointer'
        },
        {
          key: 'value',
          label: 'Expression',
          thClass: "pr-3 py-2",
          tdClass: 'text-truncate pointer'
        },
      ]
    },
  },

  async created () {
    this.$set(this.item.config, 'arguments', this.item.config.arguments || [])

    await this.getTypes()
  },

  methods: {
    addArgument () {
      this.item.config.arguments.push({
        target: '',
        expr: '',
        type: 'Any',
        _showDetails: true
      })
      this.$root.$emit('change-detected')
    },

    removeArgument (index) {
      this.item.config.arguments.splice(index, 1)
      this.$root.$emit('change-detected')
    },

    async getTypes () {
      return this.$AutomationAPI.typeList()
        .then(({ set }) => this.fieldTypes = set)
        .catch(this.defaultErrorHandler('Failed to fetch types'))
    }
  }
}
</script>
