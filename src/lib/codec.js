export function decodeGraph (model, vertices) {
  console.log(model.cells)
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
            parent,
            source,
            target
          }
        })
      }

      return {
        ...((vertices[cell.id] || {}).config || {}),
        ext: {
          graphics: cell
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
      return {
        title,
        icon: icon ? icon : `icons/${type}.svg`,
        width,
        height,
        style: style ? style : `shape=${type}`
      }
    }
  })
}
