export function decodeGraph (model, vertices) {
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
  return config.toolbarConfig.map(({ line = false, title, width, height, type }) => {
    if (line) {
      return {
        line
      }
    } else {
      return {
        title,
        icon: `icons/${type}.gif`,
        width,
        height,
        style: `shape=${type}`
      }
    }
  })
}
