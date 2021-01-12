export function encodeGraph (model, vertices, edges) {
  const paths = {}

  const steps = Object.values(model.cells)
    .filter(cell => {
      return !!cell.vertex
    }).map(cell => {
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
        edges: (cell.edges || []).forEach(({ id, value, parent, source, target }) => {
          if (!paths[id]) {
            paths[id] = {
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
                }
              }
            }
          }
        })
      }

      const vertex = mapVertexKind(vertices[cell.id])

      return {
        ...vertex.config,
        meta: {
          label: cell.value || '',
          description: '',
          visual: cell,
        }
      }
    })

  return { steps, paths: Object.values(paths) }
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

      if (type === 'symbol') {
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
  } else if (kind.includes('task')) {
    return { kind: 'expressions' }
  }

  return { kind: kind || '' }
}

const eventKinds = {
  'eventStart': { kind: 'event', ref: 'start' },
  'eventIntermediate': { kind: 'event', ref: 'intermediate' },
  'eventEnd': { kind: 'event', ref: 'end' },
}

const gatewayKinds = {
  'gatewayExclusive': { kind: 'gateway', ref: 'excl' },
  'gatewayInclusive': { kind: 'gateway', ref: 'incl' },
}