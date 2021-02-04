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
    width: 80,
    height: 80,
    icon: `${process.env.BASE_URL}icons/expressions.svg`,
    style: `expressions;image=${process.env.BASE_URL}icons/expressions.svg`
  },

  function: {
    width: 80,
    height: 80,
    icon: `${process.env.BASE_URL}icons/function.svg`,
    style: `function;image=${process.env.BASE_URL}icons/function.svg`
  },

  iterator: {
    width: 80,
    height: 80,
    icon: `${process.env.BASE_URL}icons/iterator.svg`,
    style: `iterator;image=${process.env.BASE_URL}icons/iterator.svg`
  },

  trigger: {
    width: 60,
    height: 60,
    icon: `${process.env.BASE_URL}icons/trigger.svg`,
    style: `trigger;event;image=${process.env.BASE_URL}icons/trigger.svg`
  },

  'error-handler': {
    width: 60,
    height: 60,
    icon: `${process.env.BASE_URL}icons/error-handler.svg`,
    style: `error-handler;image=${process.env.BASE_URL}icons/error-handler.svg`
  },

  gatewayExcl: {
    width: 80,
    height: 80,
    icon: `${process.env.BASE_URL}icons/gatewayExcl.svg`,
    style: `gatewayExclusive;gateway;image=${process.env.BASE_URL}icons/gatewayExcl.svg`
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