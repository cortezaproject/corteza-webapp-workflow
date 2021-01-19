<template>
  <b-form>
    <div
      v-if="eventType === 'start'"
      class="h-100"
    >
      <b-form-group
        label="Resource"
      >
        <b-form-select
          v-model="item.triggers.resourceType"
          :options="triggerResourceTypes"
        />
      </b-form-group>

      <b-form-group
        label="Type"
      >
        <b-form-select
          v-model="item.triggers.eventType"
          :options="triggerEventTypes"
        />
      </b-form-group>

      <b-form-group>
        <template #label>
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
        </template>

        <b-input-group
          v-for="(constraint, index) in constraints"
          :key="index"
          class="mb-2"
        >
          <b-form-input
            v-model="constraint.name"
            placeholder="Resource"
          />

          <b-form-select
            v-model="constraint.op"
            :options="constraintOperatorTypes"
          />

          <b-form-input
            v-model="constraint.values[0]"
            placeholder="Value"
          />

          <b-button
            class="ml-1"
            variant="danger"
            @click="removeConstraint(index)"
          >
            X
          </b-button>
        </b-input-group>
      </b-form-group>

      <b-form-checkbox
        v-model="item.triggers.enabled"
      >
        Enabled
      </b-form-checkbox>
    </div>
  </b-form>
</template>

<script>
import base from './base'

export default {
  extends: base,

  data () {
    return {
      modules: [],
    }
  },

  computed: {
    eventType () {
      return this.item.config.ref
    },

    triggerResourceTypes () {
     return [
        { value: null, text: 'Select resource type', disabled: true },
        { value: 'compose:record', text: 'Compose Record' },
      ]
    },

    triggerEventTypes () {
     return [
        { value: null, text: 'Select event type', disabled: true },
        { value: 'beforeCreate', text: 'Before Create' },
        { value: 'beforeUpdate', text: 'Before Update' },
        { value: 'beforeDelete', text: 'Before Delete' },
        { value: 'afterCreate', text: 'After Create' },
        { value: 'afterUpdate', text: 'After Update' },
        { value: 'afterDelete', text: 'After Delete' },
      ]
    },

    constraints () {
      return this.item.triggers.Constraints
    },

    constraintNameTypes () {
     return [
        { value: null, text: 'Select constraint type' },
        { value: 'module', text: 'Module' },
      ]
    },

    constraintOperatorTypes () {
      return [
        { value: null, text: 'Operator', disabled: true },
        { value: '=', text: '=' },
        { value: '!=', text: '!=' },
        { value: 'like', text: 'like' },
        { value: 'not like', text: 'not like' },

      ]
    },
  },

  created () {
    if (!this.item.triggers && this.eventType === 'start') {
      this.$set(this.item, 'triggers', {
        resourceType: null,
        eventType: null,
        Constraints: [],
      })
    }

    this.getModules()
  },

  methods: {
    addConstraint () {
      this.item.triggers.Constraints.push({
        name: null,
        op: null,
        values: []
      })
    },

    async getModules () {
      this.modules = await this.$ComposeAPI.moduleList({ namespaceID: '212285581999233832', sort: 'name ASC' })
        .then(({ set, filter }) => {
          return set
        })
    },

    constraintValueTypes (name) {
      if (name === 'module') {
        return this.modules.map(({ name, handle }) => {
          return {
            value: name,
            text: handle
          } 
        })
      }

      return [
        { value: undefined, text: 'Select constraint name' },
      ]
    },

    removeConstraint (index) {
      this.item.triggers.Constraints.splice(index, 1)
    }
  }
}
</script>
