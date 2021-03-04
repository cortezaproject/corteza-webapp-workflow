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
    style: 'swimlane'
  },

  expressions: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/expressions.svg`,
    style: `expressions`
  },

  function: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/function.svg`,
    style: `function`
  },

  iterator: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/iterator.svg`,
    style: `iterator`
  },

  break: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/break.svg`,
    style: `break;event`
  },

  continue: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/continue.svg`,
    style: `continue;event`
  },

  trigger: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/trigger.svg`,
    style: `trigger;`
  },

  'error-handler': {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/error-handler.svg`,
    style: `error-handler;event`
  },

  'error': {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/error.svg`,
    style: `error;event`
  },

  'termination': {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/termination.svg`,
    style: `termination;event`
  },

  gatewayExcl: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/gatewayExclusive.svg`,
    style: `gatewayExclusive;gateway`
  },

  gatewayIncl: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/gatewayInclusive.svg`,
    style: `gatewayInclusive;gateway`
  },

  gatewayFork: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/gatewayParallel.svg`,
    style: `gatewayParallel;gateway`
  },

  gatewayJoin: {
    width: 200,
    height: 80,
    icon: `${process.env.BASE_URL}icons/gatewayParallel.svg`,
    style: `gatewayParallel;gateway`
  }
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