<template>
  <b-card
    no-body
    class="w-100 h-100 border-0 shadow-sm rounded-lg"
  >
    <b-card-header
      class="sticky-top h5 px-2"
      header-bg-variant="white"
      header-text-variant="primary"
    >
      <div
        class="d-flex"
      >
        Arguments
        <b-button
          variant="link"
          class="align-top border-0 p-0 ml-auto"
          @click="addArgument()"
        >
          + Add
        </b-button>
      </div>
    </b-card-header>

    <b-card-body
      v-if="item.config.arguments.length"
      class="p-0 border-top border-primary"
    >
      <b-table
        id="arguments"
        outlined
        fixed
        head-variant="light"
        class="mb-0"
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
          >
            <b-form-input
              v-model="a.target"
              placeholder="Target"
              @input="$root.$emit('change-detected')"
            />
          </b-form-group>

          <b-form-group
            label="Type"
          >
            <b-form-select
              v-model="a.type"
              :options="fieldTypes"
              @input="$root.$emit('change-detected')"
            />
          </b-form-group>

          <b-form-group
            label="Expression"
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
          label: 'Name',
          tdClass: 'border-top text-truncate pointer'
        },
        {
          key: 'type',
          class: 'text-center',
          tdClass: 'border-top text-truncate pointer'
        },
        {
          key: 'value',
          class: 'text-right',
          tdClass: 'border-top text-truncate pointer'
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
