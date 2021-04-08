<template>
  <b-card
    class="flex-grow-1 rounded-0"
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
      class="p-0"
    >
      <b-table
        id="arguments"
        fixed
        borderless
        hover
        head-row-variant="secondary"
        details-td-class="bg-white"
        :items="item.config.arguments"
        :fields="argumentFields"
        :tbody-tr-class="rowClass"
        @row-clicked="item=>$set(item, '_showDetails', !item._showDetails)"
      >
        <template #cell(target)="{ item: a }">
          <var>{{ a.target }}</var>
          <samp> ({{ a.type }})</samp>
        </template>

        <template #cell(type)="{ item: a }">
          <var>{{ a.type }}</var>
        </template>

        <template #cell(value)="{ item: a, index }">
          <div
            class="text-truncate"
            :class="{ 'w-75': a._showDetails}"
          >
            <samp>{{ a.expr }}</samp>
          </div>

          <b-button
            v-if="a._showDetails"
            variant="outline-danger"
            class="position-absolute trash border-0"
            @click="removeArgument(index)"
          >
            <font-awesome-icon
              :icon="['far', 'trash-alt']"
            />
          </b-button>
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

            <b-form-group
              label="Type"
              label-class="text-primary"
            >
              <b-form-select
                v-model="a.type"
                :options="fieldTypes"
                @change="$root.$emit('change-detected')"
              />
            </b-form-group>

            <b-form-group
              label="Expression"
              label-class="text-primary"
              class="mb-0"
            >
              <b-form-textarea
                v-model="a.expr"
                placeholder="Expression..."
                max-rows="5"
                @change="$root.$emit('change-detected')"
              />
            </b-form-group>
          </b-card>
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
      fieldTypes: [],
    }
  },

  computed: {
    argumentFields () {
      return [
        {
          key: 'target',
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
          label: 'Expression',
          thClass: 'py-2 pr-3',
          tdClass: 'position-relative pointer',
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
        _showDetails: true,
      })
      this.$root.$emit('change-detected')
    },

    removeArgument (index) {
      this.item.config.arguments.splice(index, 1)
      this.$root.$emit('change-detected')
    },

    async getTypes () {
      return this.$AutomationAPI.typeList()
        .then(({ set }) => {
          this.fieldTypes = set
        })
        .catch(this.defaultErrorHandler('Failed to fetch types'))
    },

    rowClass (item, type) {
      if (type === 'row') {
        return item._showDetails ? 'border-thick' : 'border-thick-transparent'
      } else if (type === 'row-details') {
        return ''
      }
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
