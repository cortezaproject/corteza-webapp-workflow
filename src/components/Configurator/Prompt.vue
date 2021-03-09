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
          label="Message"
          label-class="text-primary"
          class="mb-0"
        >
          <b-form-input
            v-model="item.config.arguments[0].value"
            placeholder="Prompt message"
            @input="$root.$emit('change-detected')"
          />
        </b-form-group>
      </b-card-body>
    </b-card>
    <b-card
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
          head-row-variant="secondary"
          class="mb-4"
          :items="item.config.results"
          :fields="resultFields"
          @row-clicked="item=>$set(item, '_showDetails', !item._showDetails)"
        >
          <template #cell(result)="{ item: a }">
            <samp>{{ a.source }}</samp>
          </template>

          <template #row-details="{ item: a }">
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

  computed: {
    resultFields () {
      return [
        {
          key: 'target',
          thClass: "pl-3 py-2",
          tdClass: 'text-truncate pointer'
        },
        {
          key: 'result',
          thClass: "pr-3 py-2",
          tdClass: 'text-truncate pointer'
        },
      ]
    },
  },

   watch: {
    'item.node.id': {
      immediate: true,
      async handler () {
        this.processing = true

        this.$set(this.item.config, 'arguments', this.item.config.arguments || [{
          target: 'message',
          type: 'String',
          value: ''
        }])

        this.$set(this.item.config, 'results', this.item.config.results || [{
          target: '',
          source: 'message'
        }])

        this.processing = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.pointer {
  cursor: pointer;
}
</style>