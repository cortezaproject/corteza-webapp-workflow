<template>
  <div
    v-if="!processing"
  >
    <b-form-group
      label="Type"
    >
      <b-form-select
        v-model="item.config.ref"
        :options="functionTypes"
        @input="setParams"
      />
    </b-form-group>

    <b-card
      v-if="args.length"
      no-body
      class="w-100 h-100 shadow-sm rounded-lg"
    >
      <b-card-header
        class="sticky-top h5 px-2"
        header-bg-variant="white"
        header-text-variant="primary"
        header-border-variant="primary"
      >
        Arguments
      </b-card-header>

      <b-card-body
        class="p-0"
      >
        <b-table
          id="arguments"
          outlined
          fixed
          head-variant="light"
          class="mb-0"
          :items="args"
          :fields="argumentFields"
          @row-clicked="item=>$set(item, '_showDetails', !item._showDetails)"
        >
          <template #cell(target)="{ item: a }">
            <samp>
              {{ `${a.target}${a.required ? '*' : ''}` }}
            </samp>
          </template>

          <template #cell(type)="{ item: a }">
            <var>{{ a.type }}</var>
          </template>

          <template #cell(value)="{ item: a }">
            <samp>{{ a[a.valueType] }}</samp>
          </template>

          <template #row-details="{ item: a }">
            <b-form-group
              v-if="(paramTypes[item.config.ref][a.target] || []).length > 2"
              label="Type"
            >
              <b-form-select
                v-model="a.type"
                :options="(paramTypes[item.config.ref][a.target] || [])"
                :disabled="(paramTypes[item.config.ref][a.target] || []).length <= 1" 
              />
              <hr>
            </b-form-group>


            <b-form-group
              label="Value type"
            >
              <b-form-radio-group
                id="value-types"
                v-model="a.valueType"
                :options="valueTypes"
                button-variant="outline-primary"
                buttons
                class="bg-white"
              />
            </b-form-group>

            <b-form-input
              v-if="a.valueType === 'value'"
              v-model="a.value"
              placeholder="Value"
            />

            <b-form-input
              v-else-if="a.valueType === 'source'"
              v-model="a.source"
              placeholder="Source"
            />

            <b-form-input
              v-else-if="a.valueType === 'expr'"
              v-model="a.expr"
              placeholder="Expression"
            />
          </template>
        </b-table>
      </b-card-body>
    </b-card>

    <b-card
      v-if="results.length"
      no-body
      class="w-100 h-100 shadow-sm rounded-lg mt-3"
    >
      <b-card-header
        class="sticky-top h5 px-2"
        header-bg-variant="white"
        header-text-variant="primary"
        header-border-variant="primary"
      >
        Results
      </b-card-header>

      <b-card-body
        class="p-0"
      >
        <b-table
          id="results"
          outlined
          fixed
          head-variant="light"
          class="mb-0"
          :items="results"
          :fields="resultFields"
          @row-clicked="item=>$set(item, '_showDetails', !item._showDetails)"
        >
          <template #cell(type)="{ item: a }">
            <var>{{ a.type }}</var>
          </template>

          <template #cell(value)="{ item: a }">
            <samp>{{ a.expr }}</samp>
          </template>

          <template #row-details="{ item: a }">
            <b-form-group
              label="Target"
            >
              <b-form-input
                v-model="a.target"
                placeholder="Target"
              />
            </b-form-group>

            <b-form-group
              label="Result"
              class="mb-0"
            >
              <b-form-input
                v-model="a.expr"
                placeholder="Expression"
              />
            </b-form-group>
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
      processing: true,

      functions: [],
      args: [],
      results: [],

      paramTypes: {},
      resultTypes: {},
    }
  },

  computed: {
    functionTypes () {
      return [
        { value: '', text: 'Select function', disabled: true },
        ...this.functions.map(({ ref, meta }) => ({ value: ref, text: meta.short })),
      ]
    },

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

    resultFields () {
      return [
        {
          key: 'target',
          tdClass: 'border-top text-truncate pointer'
        },
        {
          key: 'type',
          class: 'text-center',
          tdClass: 'border-top text-truncate pointer'
        },
        {
          key: 'expr',
          label: 'Result',
          class: 'text-right',
          tdClass: 'border-top text-truncate pointer'
        },
      ]
    },

    valueTypes () {
      return [
        { text: 'Value', value: 'value' },
        { text: 'Source', value: 'source' },
        { text: 'Expression', value: 'expr' },
      ]
    }
  },

  watch: {
    'item.node.id': {
      immediate: true,
      async handler () {
        this.processing = true

        this.$set(this.item.config, 'arguments', this.item.config.arguments || [])
        this.$set(this.item.config, 'results', this.item.config.results || [])

        await this.getFunctionTypes()
        await this.getTypes()

        this.setParams(this.item.config.ref)

        this.processing = false
      }
    },

    args: {
      deep: true,
      handler (args) {
        this.item.config.arguments = args.filter(({ value, source, expr }) => value || source || expr)
          .map(arg => {
            if (arg.valueType !== 'value') {
              arg.value = undefined
            } 

            if (arg.valueType !== 'source') {
              arg.source = undefined
            }

            if (arg.valueType !== 'expr') {
              arg.expr = undefined
            }

            return arg
          })
      }
    },

    results: {
      deep: true,
      handler (res) {
        this.item.config.results = res.filter(({ target }) => target).map(({ target, expr }) => ({ target, expr }))
      }
    }
  },

  methods: {
    setParams (fName) {
      this.args = []
      this.results = []

      if (fName) {
        const func = this.functions.find(({ ref }) => ref === fName)

        // Set parameters
        if (!this.paramTypes[func.ref]) {
          this.paramTypes[func.ref] = {}
          func.parameters?.forEach(({ name, types }) => {
            this.paramTypes[func.ref][name] = types || []
          })
        }

        this.args = func.parameters?.map(param => {
          const arg = this.item.config.arguments.find(({ target }) => target === param.name) || {}
          return {
            name: param.name,
            target: param.name,
            type: arg.type || this.paramTypes[func.ref][param.name][0],
            valueType: this.getValueType(arg),
            value: arg.value || undefined,
            source: arg.source || undefined,
            expr: arg.expr || undefined,
            required: param.required || false
          }
        }) || []

        // Set results
        if (!this.resultTypes[func.ref]) {
          this.resultTypes[func.ref] = {}
          func.results?.forEach(({ name, types }) => {
            this.resultTypes[func.ref][name] = types || []
          })
        }

        this.results = func.results?.map(result => {
          const res = this.item.config.results.find(({ expr }) => expr === result.name) || {}
          return {
            name: result.name,
            valueType: 'expr',
            target: res.target || undefined,
            type: this.resultTypes[func.ref][result.name][0],
            expr: res.expr || result.name
          }
        }) || []
      }
    },

    async getFunctionTypes () {
      return this.$AutomationAPI.functionList()
        .then(({ set }) => this.functions = set.filter(({ kind = '' }) => kind !== 'iterator').sort((a, b) => a.meta.short.localeCompare(b.meta.short) ? 1 : -1))
        .catch(this.defaultErrorHandler('Failed to fetch functions'))
    },

    async getTypes () {
      return this.$AutomationAPI.typeList()
        .then(({ set }) => this.types = set)
        .catch(this.defaultErrorHandler('Failed to fetch types'))
    },

    getValueType (item) {
      let type = 'value'

      if (item.source) {
        type = 'source'
      } else if (item.expr) {
        type = 'expr'
      }

      return type
    }
  }
}
</script>

<style lang="scss">
.pointer {
  cursor: pointer;
}

.b-table-details {
  padding: 0;
  background-color: #e9ecef
}
</style>
