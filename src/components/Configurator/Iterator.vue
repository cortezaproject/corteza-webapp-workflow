<script>
import Function from './Function'

export default {
  extends: Function,

  methods: {
    async getFunctionTypes () {
      return this.$AutomationAPI.functionList()
        .then(({ set }) => this.functions = set.filter(({ kind = '' }) => kind === 'iterator').sort((a, b) => a.meta.short.localeCompare(b.meta.short) ? 1 : -1))
        .catch(this.defaultErrorHandler('Failed to fetch functions'))
    },
  }
}
</script>
