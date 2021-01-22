<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => {},
    },

    edges: {
      type: Object,
      default: () => {},
    },
  },

  computed: {
    kind () {
      if (this.item.workflowID) {
        return 'Workflow'
      } else {
        const { kind } = this.item.config
        if (kind) {
          return kind.charAt(0).toUpperCase() + kind.slice(1)
        }
      }

      return undefined
    },

    getSelectedItemConfigJSON: {
      get () {
        let config = {}
        if (this.item) {
          config = this.item.config
        }
        return JSON.stringify(config, undefined, 2)
      },

      set (value) {
        this.item.config = JSON.parse(value)
      }
    },
  },
}
</script>
