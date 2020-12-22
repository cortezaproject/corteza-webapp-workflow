const buildVueConfig = require('./vue.config-builder')

module.exports = buildVueConfig({
  appFlavour: 'Corteza',
  appName: 'workflow',
  appLabel: 'Corteza Workflow',
  theme: 'corteza-base',
  packageAlias: 'corteza-workflow',
})
