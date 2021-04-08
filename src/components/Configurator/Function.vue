<template>
  <div
    v-if="!processing"
  >
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
          label="Type*"
          label-class="text-primary"
          class="mb-0"
        >
          <b-form-select
            v-model="item.config.ref"
            :options="functionTypes"
            @change="setParams"
          />
        </b-form-group>

        <p
          v-if="functionDescription"
          class="mt-3 mb-0"
        >
          {{ functionDescription }}
        </p>
      </b-card-body>
    </b-card>

    <b-card
      v-if="args.length"
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
          Arguments
        </h5>
      </b-card-header>

      <b-card-body
        class="p-0"
      >
        <b-table
          id="arguments"
          fixed
          borderless
          hover
          head-row-variant="secondary"
          details-td-class="bg-white"
          class="mb-4"
          :items="args"
          :fields="argumentFields"
          :tbody-tr-class="rowClass"
          @row-clicked="item=>$set(item, '_showDetails', !item._showDetails)"
        >
          <template #cell(target)="{ item: a }">
            <var>{{ `${a.target}${a.required ? '*' : ''}` }}</var>
            <samp v-if="!isWhileIterator"> ({{ a.type }})</samp>
          </template>

          <template #cell(type)="{ item: a }">
            <var>{{ a.type }}</var>
          </template>

          <template #cell(value)="{ item: a }">
            <samp>{{ a[a.valueType] }}</samp>
          </template>

          <template #row-details="{ item: a, index }">
            <div class="arrow-up" />

            <b-card
              class="bg-light"
            >
              <b-form-group
                v-if="(paramTypes[item.config.ref][a.target] || []).length > 1"
                label="Type"
                label-class="text-primary"
                class="mb-0"
              >
                <b-form-select
                  v-model="a.type"
                  :options="(paramTypes[item.config.ref][a.target] || [])"
                  :disabled="(paramTypes[item.config.ref][a.target] || []).length <= 1"
                  @change="$root.$emit('change-detected')"
                />
                <hr>
              </b-form-group>

              <b-form-group
                v-if="!a.options.length && !isWhileIterator"
                label="Value type"
                label-class="text-primary"
              >
                <b-form-radio-group
                  id="value-types"
                  v-model="a.valueType"
                  :options="valueTypes"
                  button-variant="outline-primary"
                  buttons
                  class="w-100 bg-white"
                  @change="valueTypeChanged($event, index)"
                />
              </b-form-group>

              <b-form-group
                label="Value"
                label-class="text-primary"
                class="mb-0"
              >
                <b-form-select
                  v-if="a.options.length"
                  v-model="a.value"
                  :options="[...defaultOptions, ...a.options]"
                  @change="$root.$emit('change-detected')"
                />

                <b-form-textarea
                  v-else-if="a.valueType === 'value'"
                  v-model="a.value"
                  max-rows="5"
                  @change="$root.$emit('change-detected')"
                />

                <b-form-textarea
                  v-else-if="a.valueType === 'expr'"
                  v-model="a.expr"
                  max-rows="5"
                  @change="$root.$emit('change-detected')"
                />
              </b-form-group>
            </b-card>
          </template>
        </b-table>
      </b-card-body>
    </b-card>

    <b-card
      v-if="results.length"
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
          Results
        </h5>
      </b-card-header>

      <b-card-body
        class="p-0"
      >
        <b-table
          id="results"
          fixed
          borderless
          hover
          head-row-variant="secondary"
          details-td-class="bg-white"
          class="mb-4"
          :items="results"
          :fields="resultFields"
          :tbody-tr-class="rowClass"
          @row-clicked="item=>$set(item, '_showDetails', !item._showDetails)"
        >
          <template #cell(type)="{ item: a }">
            <var>{{ a.type }}</var>
          </template>

          <template #cell(value)="{ item: a }">
            <samp>{{ a.expr }}</samp>
          </template>

          <template #row-details="{ item: a }">
            <div class="arrow-up" />

            <b-card
              class="bg-light"
            >
              <b-form-group
                label="Target"
                label-class="text-primary"
              >
                <b-form-input
                  v-model="a.target"
                  placeholder="Target"
                  @change="$root.$emit('change-detected')"
                />
              </b-form-group>
            </b-card>
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
          thClass: 'pl-3 py-2',
          tdClass: 'text-truncate pointer',
        },
        // {
        //   key: 'type',
        //   thClass: "py-2",
        //   tdClass: 'text-truncate pointer'
        // },
        {
          key: 'value',
          thClass: 'pr-3 py-2',
          tdClass: 'text-truncate pointer',
        },
      ]
    },

    resultFields () {
      return [
        {
          key: 'target',
          thClass: 'pl-3 py-2',
          tdClass: 'text-truncate pointer',
        },
        {
          key: 'type',
          thClass: 'py-2',
          tdClass: 'text-truncate pointer',
        },
        {
          key: 'expr',
          label: 'Result',
          thClass: 'pr-3 py-2',
          tdClass: 'text-truncate pointer',
        },
      ]
    },

    valueTypes () {
      return [
        { text: 'Expression', value: 'expr' },
        { text: 'Constant', value: 'value' },
      ]
    },

    defaultOptions () {
      return [{ value: null, text: 'Select an option', disabled: true }]
    },

    functionDescription () {
      return (this.functions.find(({ ref }) => ref === this.item.config.ref) || { meta: {} }).meta.description
    },

    isWhileIterator () {
      if (this.item.config) {
        return this.item.config.kind === 'iterator' && this.item.config.ref === 'loopDo'
      }
      return false
    },
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

        this.setParams(this.item.config.ref, true)

        this.processing = false
      },
    },

    args: {
      deep: true,
      handler (args) {
        this.item.config.arguments = args.filter(({ value, source, expr }) => value || source || expr)
          .map(arg => {
            const argMapped = {
              target: arg.target,
              type: arg.type,
            }

            argMapped[arg.valueType] = arg[arg.valueType]

            return argMapped
          })
      },
    },

    results: {
      deep: true,
      handler (res) {
        this.item.config.results = res.filter(({ target }) => target).map(({ target, expr }) => ({ target, expr }))
      },
    },
  },

  methods: {
    setParams (fName, immediate = false) {
      this.args = []
      this.results = []

      if (!immediate) {
        this.$root.$emit('change-detected')
      }

      if (fName) {
        const func = this.functions.find(({ ref }) => ref === fName)

        // Set parameters
        if (!this.paramTypes[func.ref] && func.parameters) {
          this.paramTypes[func.ref] = {}
          func.parameters.forEach(({ name, types }) => {
            this.paramTypes[func.ref][name] = types || []
          })
        }

        this.args = func.parameters?.map(param => {
          const arg = this.item.config.arguments.find(({ target }) => target === param.name) || {}
          return {
            name: param.name,
            target: param.name,
            type: arg.type || this.paramTypes[func.ref][param.name][0],
            valueType: this.getValueType(arg, ((param.meta || {}).visual || {}).options),
            value: arg.value || null,
            expr: arg.expr || arg.source || null,
            required: param.required || false,
            options: ((param.meta || {}).visual || {}).options || [],
          }
        }) || []

        // Set results
        if (!this.resultTypes[func.ref] && func.results) {
          this.resultTypes[func.ref] = {}
          func.results.forEach(({ name, types }) => {
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
            expr: res.expr || result.name,
          }
        }) || []
      }
    },

    async getFunctionTypes () {
      return this.$AutomationAPI.functionList()
        .then(({ set }) => {
          this.functions = set.filter(({ kind = '' }) => kind !== 'iterator').sort((a, b) => a.meta.short.localeCompare(b.meta.short))
        })
        .catch(this.defaultErrorHandler('Failed to fetch functions'))
    },

    async getTypes () {
      return this.$AutomationAPI.typeList()
        .then(({ set }) => {
          this.types = set
        })
        .catch(this.defaultErrorHandler('Failed to fetch types'))
    },

    valueTypeChanged (valueType, index) {
      const oldType = valueType === 'value' ? 'expr' : 'value'
      this.args[index][valueType] = this.args[index][oldType]
      this.$root.$emit('change-detected')
    },

    getValueType (item, options = []) {
      if (options.length || this.isWhileIterator) {
        return 'value'
      } else {
        return item.value ? 'value' : 'expr'
      }
    },

    rowClass (item, type) {
      return item._showDetails && type === 'row' ? 'border-thick' : 'border-thick-transparent'
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
