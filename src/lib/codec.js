export function encodeGraph (model, vertices) {
  return Object.values(model.cells)
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
        parent: cell.parent,
        value: cell.value,
        type: cell.style,
        edges: (cell.edges || []).map(({ id, value, parent, source, target }) => {
          return {
            id,
            value,
            parent: parent.id,
            source: source.id,
            target: target.id,
          }
        })
      }

      return {
        ...((vertices[cell.id] || {}).config || {}),
        meta: {
          label: cell.value || '',
          description: '',
          visual: cell,
        }
      }
    })
}

export function decodeToolbar (config) {
  return config.toolbarConfig.map(({ title, width, height, type, icon = '', style = '' }) => {
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

      return {
        title,
        icon,
        width,
        height,
        type,
        style,
      }
    }
  })
}
