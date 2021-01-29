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

    <b-form-group
      v-if="args.length"
      label="Arguments"
    >
      <b-input-group
        v-for="(argument, index) in args"
        :key="index"
        class="mb-2"
      >
        <b-form-input
          v-model="argument.target"
          disabled
          placeholder="Target"
        />

        <b-form-select
          v-model="argument.type"
          :options="(paramTypes[item.config.ref][argument.target] || [])"
          :disabled="(paramTypes[item.config.ref][argument.target] || []).length <= 1" 
        />

        <b-form-input
          v-model="argument.value"
          placeholder="Value"
        />

        <b-form-input
          v-model="argument.source"
          placeholder="Source"
        />

        <b-form-input
          v-model="argument.expr"
          placeholder="Expression"
        />
      </b-input-group>
    </b-form-group>

    <b-form-group
      v-if="results.length"
      label="Results"
    >
      <b-input-group
        v-for="(result, index) in results"
        :key="index"
        class="mb-2"
      >
        <b-form-input
          v-model="result.target"
          placeholder="Target"
        />

        <b-form-select
          v-model="result.type"
          :options="(resultTypes[item.config.ref][result.name] || [])"
          disabled
        />

        <b-form-input
          v-model="result.expr"
          disabled
          placeholder="Expression"
        />
      </b-input-group>
    </b-form-group>
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
            value: arg.value || undefined,
            source: arg.source || undefined,
            expr: arg.expr || undefined
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
            target: res.target || undefined,
            type: this.resultTypes[func.ref][result.name][0],
            expr: res.expr || result.name
          }
        }) || []
      }
    },

    async getFunctionTypes () {
      return this.$AutomationAPI.functionList()
        .then(({ set }) => this.functions = set.filter(({ kind = '' }) => kind === 'iterator').sort((a, b) => a.meta.short.localeCompare(b.meta.short) ? 1 : -1))
        .catch(err => console.error(err))
    },

    async getTypes () {
      return this.$AutomationAPI.typeList()
        .then(({ set }) => this.types = set)
        .catch(err => console.error(err))
    }
  }
}
</script>
