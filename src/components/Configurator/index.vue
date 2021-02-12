<template>
  <div
    class="d-flex flex-column"
  >
    <b-card
      no-body
      no-border
      class="flex-grow-1 mb-1 border-0"
    >
      <b-card-header
        header-tag="header"
        class="p-0"
      >
        <b-button
          block
          variant="primary"
          class="d-flex align-items-center justify-content-between px-2 py-1"
          @click="collapse.basic = !collapse.basic"
        >
          <span
            class="h5 mb-0"
          >
            General
          </span>
          <font-awesome-icon
            :icon="['fas', collapse.configurator ? 'chevron-down' : 'chevron-left']"
          />
        </b-button>
      </b-card-header>
      <b-collapse
        v-model="collapse.basic"
        appear
        accordion="basic"
      >
        <b-card-body
          class="p-2"
        >
          <basic
            :item="item"
            @update-value="$emit('update-value', $event)"
          />
        </b-card-body>
      </b-collapse>
    </b-card>

    <b-card
      v-if="stepComponent"
      no-body
      class="flex-grow-1 border-0"
    >
      <b-card-header
        header-tag="header"
        class="p-0"
      >
        <b-button
          block
          variant="primary"
          class="d-flex align-items-center justify-content-between px-2 py-1"
          @click="collapse.configurator = !collapse.configurator"
        >
          <span
            class="h5 mb-0"
          >
            Configuration
          </span>
          <font-awesome-icon
            :icon="['fas', collapse.configurator ? 'chevron-down' : 'chevron-left']"
          />
        </b-button>
      </b-card-header>
      <b-collapse
        v-model="collapse.configurator"
        appear
        accordion="configurator"
      >
        <b-card-body
          class="p-0"
        >
          <component
            :is="stepComponent"
            :item="item"
            :edges="edges"
            @update-edge="$emit('update-edge', $event)"
          />
        </b-card-body>
      </b-collapse>
    </b-card>
  </div>
</template>
<script>
import base from './base'
import basic from './basic'
import * as Configurators from './loader'

export default {
  components: {
    ...Configurators,
    basic,
  },

  extends: base,

  data () {
    return {
      collapse: {
        basic: true,
        configurator: true,
      }
    }
  },

  computed: {
    stepComponent () {
      return Configurators[this.kind]
    },
  },
}
</script>
