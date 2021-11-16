<template>
  <ace-editor
    v-model="expressionValue"
    :lang="lang"
    :mode="lang"
    theme="chrome"
    width="100%"
    :height="height"
    :class="{ 'border': border }"
    v-on="$listeners"
    @init="editorInit"
  />
</template>

<script>
import AceEditor from 'vue2-ace-editor'

export default {
  components: {
    AceEditor,
  },

  props: {
    value: {
      type: String,
      default: '',
    },

    lang: {
      type: String,
      default: 'text',
    },

    height: {
      type: String,
      default: '80',
    },

    showLineNumbers: {
      type: Boolean,
      default: false,
    },

    fontSize: {
      type: String,
      default: '14px',
    },

    border: {
      type: Boolean,
      default: true,
    },
  },

  computed: {
    expressionValue: {
      get () {
        return this.value
      },

      set (value = '') {
        this.$emit('update:value', value)
      },
    },
  },

  methods: {
    editorInit (editor) {
      require('brace/mode/text')
      require('brace/mode/javascript')
      require('brace/theme/chrome')

      editor.setOptions({
        tabSize: 2,
        fontSize: this.fontSize,
        wrap: true,
        indentedSoftWrap: false,
        showLineNumbers: this.showLineNumbers,
        showGutter: this.showLineNumbers,
        displayIndentGuides: this.lang !== 'text',
        useWorker: false,
      })

      editor.session.on('changeMode', (e, session) => {
        if (session.getMode().$id === 'brace/mode/javascript') {
          if (session.$worker) {
            session.$worker.send('changeOptions', [{
              asi: true, // disable "Missing semicolon." warning in editor for JavaScript
            }])
          }
        }
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.border {
  background-color: #FFF;
  border: 2px solid #E4E9EF;
  border-radius: 0.25rem;
}
</style>
