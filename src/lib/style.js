export function getStyleFromKind ({ kind = '', ref = '' }) {
  let kindRef = kind

  if (['visual', 'gateway'].includes(kind)) {
    kindRef = `${kind}${ref ? (ref[0].toUpperCase() + ref.slice(1).toLowerCase()) : ''}`
  }

  return kindToStyle[kindRef] || {}
}

// The style property tells mxGraph what internal style to use for displaying the specific step
const kindToStyle = {
  visualSwimlane: {
    width: 320,
    height: 160,
    icon: '/icons/swimlane.svg',
    tooltip: 'Visually group steps',
    style: 'swimlane',
  },

  expressions: {
    width: 200,
    height: 80,
    icon: '/icons/expressions.svg',
    tooltip: 'Define and mutate scope variables',
    style: 'expressions',
  },

  function: {
    width: 200,
    height: 80,
    icon: '/icons/function.svg',
    tooltip: 'Execute the chosen predefined function',
    style: 'function',
  },

  iterator: {
    width: 200,
    height: 80,
    icon: '/icons/iterator.svg',
    tooltip: 'Iterate over items',
    style: 'iterator',
  },

  break: {
    width: 200,
    height: 80,
    icon: '/icons/break.svg',
    tooltip: 'Stop iterator execution and continue with workflow',
    style: 'break',
  },

  continue: {
    width: 200,
    height: 80,
    icon: '/icons/continue.svg',
    tooltip: 'Stop current iteration and continue with the next one',
    style: 'continue',
  },

  trigger: {
    width: 200,
    height: 80,
    icon: '/icons/trigger.svg',
    tooltip: 'Trigger the workflow execution based on configuration',
    style: 'trigger',
  },

  'error-handler': {
    width: 200,
    height: 80,
    icon: '/icons/error-handler.svg',
    tooltip: 'Continue workflow from this step if an error is triggered',
    style: 'error-handler',
  },

  error: {
    width: 200,
    height: 80,
    icon: '/icons/error.svg',
    tooltip: 'Throws error and stops workflow execution, also prevents saving of records triggered with before trigger',
    style: 'error',
  },

  termination: {
    width: 200,
    height: 80,
    icon: '/icons/termination.svg',
    tooltip: 'Terminate workflow execution',
    style: 'termination',
  },

  gatewayExcl: {
    width: 200,
    height: 80,
    icon: '/icons/gateway-exclusive.svg',
    tooltip: 'Workflow execution can continue on first path that fits condition',
    style: 'gatewayExclusive',
  },

  gatewayIncl: {
    width: 200,
    height: 80,
    icon: '/icons/gateway-inclusive.svg',
    tooltip: 'Workflow execution can continue on all paths that fit condition',
    style: 'gatewayInclusive',
  },

  gatewayFork: {
    width: 200,
    height: 80,
    icon: '/icons/gateway-parallel.svg',
    tooltip: 'Splits workflow execution into two parallel paths or merges multiple paths into one',
    style: 'gatewayParallel',
  },

  gatewayJoin: {
    width: 200,
    height: 80,
    icon: '/icons/gateway-parallel.svg',
    tooltip: 'Splits workflow execution into two parallel paths or merges multiple paths into one',
    style: 'gatewayParallel',
  },

  prompt: {
    width: 200,
    height: 80,
    icon: '/icons/prompt.svg',
    tooltip: 'Prompts user and waits for input',
    style: 'prompt',
  },

  delay: {
    width: 200,
    height: 80,
    icon: '/icons/delay.svg',
    tooltip: 'Delays workflow execution',
    style: 'delay',
  },

  debug: {
    width: 200,
    height: 80,
    icon: '/icons/debug.svg',
    tooltip: 'Logs current workflow scope into server logs. If workflow debug is enabled',
    style: 'debug',
  },
}

// When adding & or copy/pasting a new cell, this is used to determine the kind & ref
export function getKindFromStyle (vertex) {
  const { style } = vertex
  if (!style) {
    return {}
  }

  const kind = style.split(';')[0]

  if (kind.includes('gateway')) {
    if (gatewayKinds[kind]) {
      return gatewayKinds[kind]
    } else {
      // Determine if fork or join
      let inEdgeCount = 0
      let outEdgeCount = 0
      const edges = vertex.edges || []

      edges.forEach(({ source, target }) => {
        if (source.id === vertex.id) {
          outEdgeCount++
        } else if (target.id === vertex.id) {
          inEdgeCount++
        }
      })

      return { kind: 'gateway', ref: (inEdgeCount > outEdgeCount ? 'join' : 'fork') }
    }
  } else if (kind === 'swimlane') {
    return { kind: 'visual', ref: 'swimlane' }
  } else {
    return { kind }
  }
}

const gatewayKinds = {
  gatewayExclusive: { kind: 'gateway', ref: 'excl' },
  gatewayInclusive: { kind: 'gateway', ref: 'incl' },
}
