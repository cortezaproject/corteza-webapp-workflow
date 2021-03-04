export function getStyleFromKind ({ kind = '', ref = '' }) {
  let kindRef = kind

  if (['visual', 'gateway'].includes(kind)) {
    kindRef = `${kind}${ref ? (ref[0].toUpperCase() + ref.slice(1).toLowerCase()) : ''}`
  }

  return kindToStyle[kindRef] || {}
}

// Reason for process.env.BASE_URL is a tehnicality with mxGraph and the way it uses images & icons
// The style property tells mxGraph what internal style to use for displaying the specific step
const kindToStyle = {
  visualSwimlane: {
    width: 360,
    height: 120,
    icon: `${process.env.BASE_URL}icons/swimlane.svg`,
    tooltip: 'Visually group steps',
    style: 'swimlane'
  },

  expressions: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/expressions.svg`,
    tooltip: 'Define and mutate scope variables',
    style: `expressions`
  },

  function: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/function.svg`,
    tooltip: 'Execute the chosen predefined function',
    style: `function`
  },

  iterator: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/iterator.svg`,
    tooltip: 'Iterate over items',
    style: `iterator`
  },

  break: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/break.svg`,
    tooltip: 'Stop iterator execution and continue with workflow',
    style: `break`
  },

  continue: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/continue.svg`,
    tooltip: 'Stop current iteration and continue with the next one',
    style: `continue`
  },

  trigger: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/trigger.svg`,
    tooltip: 'Trigger the workflow execution based on configuration',
    style: `trigger;`
  },

  'error-handler': {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/error-handler.svg`,
    tooltip: 'Continue workflow from this step if an error is triggered',
    style: `error-handler`
  },

  error: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/error.svg`,
    tooltip: 'Throws error and stops workflow execution, also prevents saving of records triggered with before trigger',
    style: `error`
  },

  termination: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/termination.svg`,
    tooltip: 'Terminate workflow execution',
    style: `termination`
  },

  gatewayExcl: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/gatewayExclusive.svg`,
    tooltip: 'Workflow execution can continue on first path that fits condition',
    style: `gatewayExclusive`
  },

  gatewayIncl: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/gatewayInclusive.svg`,
    tooltip: 'Workflow execution can continue on all paths that fit condition',
    style: `gatewayInclusive`
  },

  gatewayFork: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/gatewayParallel.svg`,
    tooltip: 'Splits workflow execution into two parralel paths or merges multiple paths into one',
    style: `gatewayParallel`
  },

  gatewayJoin: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/gatewayParallel.svg`,
    tooltip: 'Splits workflow execution into two parralel paths or merges multiple paths into one',
    style: `gatewayParallel`
  },

  prompt: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/prompt.svg`,
    tooltip: 'Prompts user and waits for input',
    style: `prompt`
  },

  delay: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/delay.svg`,
    tooltip: 'Delays workflow execution',
    style: `delay`
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
  'gatewayExclusive': { kind: 'gateway', ref: 'excl' },
  'gatewayInclusive': { kind: 'gateway', ref: 'incl' },
}