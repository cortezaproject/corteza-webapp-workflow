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

      <b-input-group
        v-for="(argument, index) in expressionsArguments"
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
          v-model="argument.expr"
          placeholder="Expression"
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
  </div>
</template>

<script>
import base from './base'

export default {
  extends: base,

  data () {
    return {
      types: []
    }
  },

  computed: {
    fieldTypes () {
      return [
        { value: '', text: 'Select type', disabled: true },
        ...this.types
      ]
    },

    expressionsArguments () {
      return this.item.config.arguments
    },
  },

  async created () {
    this.item.config.arguments = this.item.config.arguments || []

    await this.getTypes()
  },

  
  methods: {
    addArgument () {
      this.item.config.arguments.push({
        target: '',
        expr: '',
        type: ''
      })
    },

    removeArgument (index) {
      this.item.config.arguments.splice(index, 1)
    },

    async getTypes () {
      return this.$AutomationAPI.typeList()
        .then(({ set }) => this.types = set)
        .catch(err => console.error(err))
    }
  }
}
</script>
