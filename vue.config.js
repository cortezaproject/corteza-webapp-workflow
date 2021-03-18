const buildVueConfig = require('./vue.config-builder')

module.exports = buildVueConfig({
  appFlavour: 'Corteza Workflow Editor',
  appName: 'workflow',
  appLabel: 'Corteza Workflow Editor',
  theme: 'corteza-base',
  packageAlias: 'corteza-workflow',
})
