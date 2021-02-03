<template>
  <div>
    <b-form-group>
      <template #label>
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
      </template>

      <b-table
        v-if="item.config.arguments.length"
        id="arguments"
        outlined
        fixed
        head-variant="light"
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
            />
          </b-form-group>

          <b-form-group
            label="Type"
          >
            <b-form-select
              v-model="a.type"
              :options="fieldTypes"
            />
          </b-form-group>

          <b-form-group
            label="Expression"
          >
            <b-form-input
              v-model="a.expr"
              placeholder="Expression"
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
    </b-form-group>
  </div>
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
    },

    removeArgument (index) {
      this.item.config.arguments.splice(index, 1)
    },

    async getTypes () {
      return this.$AutomationAPI.typeList()
        .then(({ set }) => this.fieldTypes = set)
        .catch(this.defaultErrorHandler('Failed to fetch types'))
    }
  }
}
</script>
