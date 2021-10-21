<template>
  <div>
    <b-button
      variant="light"
      size="lg"
      @click="show = true"
    >
      Import
    </b-button>

    <b-modal
      v-model="show"
      size="lg"
      title="Import JSON"
      ok-only
      class="d-none"
      @ok="$emit('import', workflows)"
    >
      <b-form-group
        description="NOTE: the Run as workflow property won't be imported and should be reassigned"
        class="mb-0"
      >
        <b-form-file
          placeholder="Browse or drop files to upload..."
          @input="fileUpload"
        />
      </b-form-group>

      <template #modal-footer>
        <b-button
          variant="primary"
          size="lg"
          :disabled="!workflows.length || processing"
          class="d-flex justify-content-center align-items-center"
          @click="$emit('import', workflows)"
        >
          <b-spinner
            v-if="processing"
            small
            type="grow"
          />

          <span
            v-else
          >
            Import
          </span>
        </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  data () {
    return {
      show: false,
      workflows: [],
      processing: false,
    }
  },

  methods: {
    fileUpload (file = '') {
      if (file) {
        this.processing = true
        const reader = new FileReader()

        reader.readAsText(file)

        reader.onload = (evt) => {
          try {
            const { workflows = [] } = JSON.parse(evt.target.result)
            this.workflows = workflows
          } catch (err) {
            this.defaultErrorHandler('Failed to load file')(err.message)
          } finally {
            this.processing = false
          }
        }

        reader.onerror = () => {
          this.defaultErrorHandler('Failed to load file')
          this.processing = false
        }
      }
    },
  },
}
</script>

<style>

</style>
