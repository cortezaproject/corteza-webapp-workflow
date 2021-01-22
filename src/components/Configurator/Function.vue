<template>
  <div>
    <b-form-group
      label="Type"
    >
      <b-form-select
        v-model="item.config.ref"
        :options="functionTypes"
      />
    </b-form-group>

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

      <b-input-group
        v-for="(argument, index) in functionArguments"
        :key="index"
        class="mb-2"
      >
        <b-form-input
          v-model="argument.target"
          placeholder="Target"
        />

        <b-form-select
          v-model="argument.type"
          :options="fieldTypes"
        />

        <b-form-input
          v-model="argument.value"
          placeholder="Value"
        />

        <b-form-input
          v-model="argument.source"
          placeholder="Source"
        />

        <b-button
          class="ml-1"
          variant="danger"
          @click="removeArgument(index)"
        >
          X
        </b-button>
      </b-input-group>
    </b-form-group>

    <b-form-group>
      <template #label>
        <div
          class="d-flex"
        >
          Results
          <b-button
            variant="link"
            class="align-top border-0 p-0 ml-auto"
            @click="addResult()"
          >
            + Add
          </b-button>
        </div>
      </template>

      <b-input-group
        v-for="(result, index) in functionResults"
        :key="index"
        class="mb-2"
      >
        <b-form-input
          v-model="result.target"
          placeholder="Target"
        />

        <!-- <b-form-select
          v-model="result.type"
          :options="fieldTypes"
        /> -->

        <b-form-input
          v-model="result.expr"
          placeholder="Expression"
        />

        <b-button
          class="ml-1"
          variant="danger"
          @click="removeResult(index)"
        >
          X
        </b-button>
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
      functions: [],
      types: []
    }
  },

  computed: {
    functionTypes () {
      return [
        { value: undefined, text: 'Select function', disabled: true },
        { value: 'httpRequestSend', text: 'Send HTTP request' },
        { value: 'logInfo', text: 'Log info' },
        { value: 'logDebug', text: 'Log debug' },
        { value: 'logWarn', text: 'Log warn' },
        { value: 'logError', text: 'Log error' },
      ]
    },

    fieldTypes () {
      return [
        { value: undefined, text: 'Select type', disabled: true },
        ...this.types
      ]
    },

    functionArguments () {
      return this.item.config.arguments
    },

    functionResults () {
      return this.item.config.results
    },
  },

  async created () {
    this.item.config.arguments = this.item.config.arguments || []
    this.item.config.results = this.item.config.results || []

    // await this.getFunctionTypes()
    await this.getTypes()
  },

  
  methods: {
    addArgument () {
      this.item.config.arguments.push({
        target: undefined,
        value: undefined,
        type: undefined,
        source: undefined
      })
    },

    removeArgument (index) {
      this.item.config.arguments.splice(index, 1)
    },

    addResult () {
      this.item.config.results.push({
        target: undefined,
        expr: undefined,
      })
    },

    removeResult (index) {
      this.item.config.results.splice(index, 1)
    },

    async getFunctionTypes () {
      return this.$AutomationAPI.functionList()
        .then(({ set }) => this.functions = set)
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
