export function encodeGraph (model, vertices, edges) {
  const steps = []
  const paths = {}
  const triggers = []

  Object.values(model.cells)
    .filter(cell => {
      return !!cell.vertex
    }).forEach(cell => {
      const triggerEdges = []

      cell = {
        id: cell.id,
        xywh: [
          cell.geometry.x || 0,
          cell.geometry.y || 0,
          cell.geometry.width || 0,
          cell.geometry.height || 0,
        ],
        parent: cell.parent.id,
        value: cell.value,
        type: cell.style,
        edges: (cell.edges || []).forEach(edge => {
          const { id, value, parent, source, target, geometry } = edge
          edge = {
            ...((edges[id] || {}).config || {}),
            parentID: source.id,
            childID: target.id,
            meta: {
              label: value || '',
              description: '',
              visual: {
                id,
                value,
                parent: parent.id,
                source: source.id,
                target: target.id,
                points: geometry.points
              }
            }
          }

          if (vertices[source.id].triggers || vertices[target.id].triggers) {
            triggerEdges.push(edge)
          } else if (!paths[id]) {
            paths[id] = edge
          }
        })
      }

      if (vertices[cell.id].triggers) {
        cell.edges = triggerEdges
        triggers.push({
          ...vertices[cell.id].triggers,
          stepID: (triggerEdges[0] || { childID: '0' }).childID,
          enabled: vertices[cell.id].triggers.enabled,
          constraints: vertices[cell.id].triggers.constraints,
          meta: {
            name: cell.value || '',
            description: '',
            visual: cell,
          }
        })
      } else {
        steps.push({
          ...vertices[cell.id].config,
          ...mapVertexKind(vertices[cell.id].node),
          meta: {
            label: cell.value || '',
            description: '',
            visual: cell,
          }
        })
      }

    })

  return { steps, paths: Object.values(paths), triggers }
}

export function decodeToolbar (config) {
  return config.toolbarConfig.map(({ title, width, height, type, icon, style, kind }) => {
    if (type === 'line') {
      return {
        line: true
      }
    } else if (type === 'break') {
      return {
        break: true
      }
    } else {
      icon = `${process.env.BASE_URL}${icon ? icon : `icons/${type}.svg`}`
      style = type

      if (style !== 'swimlane') {
        style = `${style};image=${icon.replace('small_', '')}`
      }

      style = `${kind};${style}`

      return {
        title,
        icon,
        width,
        height,
        type,
        style,
        kind,
      }
    }
  })
}

export function mapVertexKind (vertex) {
  const { style } = vertex
  if (!style) {
    return {}
  }

  const kind = style.split(';')[0]

  if (kind.includes('event')) {
    return eventKinds[kind]
  } else if (kind.includes('gateway')) {
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
  } else if (kind.includes('function')) {
    return { kind: 'function' }
  } else if (kind.includes('expressions')) {
    return { kind: 'expressions' }
  } else if (kind.includes('visual')) {
    return { kind: 'visual', ref: 'swimlane' }
  } else if (kind.includes('error')) {
    return { kind: 'error-handler' }
  }

  return {}
}

const eventKinds = {
  'eventStart': { kind: 'trigger', ref: 'start' },
  'eventIntermediate': { kind: 'trigger', ref: 'intermediate' },
  'eventEnd': { kind: 'trigger', ref: 'end' },
}

const gatewayKinds = {
  'gatewayExclusive': { kind: 'gateway', ref: 'excl' },
  'gatewayInclusive': { kind: 'gateway', ref: 'incl' },
}