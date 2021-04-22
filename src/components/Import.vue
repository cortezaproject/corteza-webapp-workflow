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
      ok-title="Import"
      class="d-none"
      @ok="$emit('import', workflows)"
    >
      <b-form-file
        placeholder="Browse or drop files to upload..."
        @change="fileUpload"
      />

      <h6
        v-if="processing"
        class="my-auto ml-3 "
      >
        Processing
      </h6>
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
    fileUpload (e) {
      const file = e.target.files[0]
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
