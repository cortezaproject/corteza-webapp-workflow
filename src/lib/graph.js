import mxgraph from 'mxgraph'

const {
  mxClient, mxGraph, mxEvent, mxUtils,
  mxCell, mxGeometry, mxUndoManager,
  mxKeyHandler, mxDivResizer, mxToolbar,
  mxObjectCodec, mxConstants, mxDragSource,
  mxRubberband, mxPerimeter, mxEdgeStyle,
} = mxgraph()

class JsonCodec extends mxObjectCodec {
  constructor() {
    super(() => {})
  }

  encode(value) {
    const xmlDoc = mxUtils.createXmlDocument()
    const newObject = xmlDoc.createElement("Object")

    for (let prop in value) {
      newObject.setAttribute(prop, value[prop])
    }
    return newObject
  }

  decode(model, vertices) {
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
          edges: cell.edges.map(({ id, value, parent, source, target }) => {
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
}

export default class GraphX {
  constructor(graph, toolbar = '') {
    if (!mxClient.isBrowserSupported()) {
      return mxUtils.error('Browser is not supported!', 200, false)
    }
    mxEvent.disableContextMenu(graph)
    this.graph = new mxGraph(graph)
    this.keyhandler = new mxKeyHandler(this.graph)
    this.undoManager = new mxUndoManager()
    this.jsonCodec = new JsonCodec()
    this.vertices = {}
    this.edges = {}

    if (toolbar) {
      this.toolbar = new mxToolbar(toolbar)
      this.initToolbar()
    }

    this.setup(graph)

    this.keys()
    this.events(graph)

    // this.labelDisplayOveride()
    this.styling()
  }

  setup (container) {
    this.graph.setPanning(true)
    this.graph.zoomFactor = 1.1

    this.graph.setConnectable(true)
    this.graph.setAllowDanglingEdges(false)
    new mxRubberband(this.graph) // Enables rubberband selection
    this.graph.view.setTranslate(20, 20)

    if (mxClient.IS_QUIRKS) {
      document.body.style.overflow = 'hidden'
      new mxDivResizer(container)
    }

    if (mxClient.IS_NS) {
      mxEvent.addListener(this.graph.container, 'mousedown', () => {
        if (!this.graph.isEditing()) {
          this.graph.container.setAttribute('tabindex', '-1')
          this.graph.container.focus()
        }
      })
    }
  }

  initToolbar () {    
    this.graph.dropEnabled = true

    // Matches DnD inside the this.editor.
    mxDragSource.prototype.getDropTarget = (graph, x, y) => {
      let cell = graph.getCellAt(x, y)
      
      if (!graph.isValidDropTarget(cell))
      {
        cell = null
      }

      return cell
    }

      const addVertex = (icon, w, h, style) => {
        const vertex = new mxCell(null, new mxGeometry(0, 0, w, h), style)
        vertex.setVertex(true)

        this.addToolbarItem(this.graph, this.toolbar, vertex, icon)
      }

      addVertex('icons/swimlane.gif', 120, 160, 'shape=swimlane')
      addVertex('icons/rectangle.gif', 100, 40, 'shape=task')
      addVertex('icons/rounded.gif', 100, 40, 'shape=rounded')
      addVertex('icons/ellipse.gif', 40, 40, 'shape=ellipse')
      addVertex('icons/rhombus.gif', 40, 40, 'shape=rhombus')
      addVertex('icons/triangle.gif', 40, 40, 'shape=triangle')
      addVertex('icons/cylinder.gif', 40, 40, 'shape=cylinder')
      addVertex('icons/actor.gif', 30, 40, 'shape=actor')
      this.toolbar.addLine()
  }

  keys () {
    // Register control and meta key if Mac
    this.keyhandler.getFunction = (evt) => {
      if (evt != null) {
        // If CTRL or META key is pressed
        if (evt.ctrlKey || (mxClient.IS_MAC && evt.metaKey)) {
          // If SHIFT key is pressed
          if (evt.shiftKey) {
            return this.keyhandler.controlShiftKeys[evt.keyCode]
          }
          return this.keyhandler.controlKeys[evt.keyCode]
        }

        // If only normal keys are pressed
        return this.keyhandler.normalKeys[evt.keyCode]
      }

      return null
    }

    const deleteCells = () => {
      if (this.graph.isEnabled()) {
        this.graph.removeCells()
      }
    }
    
    // Backspace
    this.keyhandler.normalKeys[8] = deleteCells
    // Delete
    this.keyhandler.normalKeys[46] = deleteCells

    // Ctrl + A
    this.keyhandler.controlKeys[65] = () => {
      if (this.graph.isEnabled()) {
        this.graph.selectAll()
      }
    }

    // Ctrl + Z
    this.keyhandler.controlKeys[90] = () => {
      if (this.graph.isEnabled()) {
        this.undoManager.undo()
      }
    }

    // Ctrl + Shift + Z
    this.keyhandler.controlShiftKeys[90] = () => {
      if (this.graph.isEnabled()) {
        this.undoManager.redo()
      }
    }
  }

  events (container) {
    // Zoom event
    mxEvent.addMouseWheelListener((evt, up) => {
      if (mxEvent.isConsumed(evt)) {
        return
      }

      if (mxEvent.isControlDown(evt)) {
        return
      }

      let gridEnabled = this.graph.gridEnabled

      this.graph.gridEnabled = false

      let p1 = this.graph.getPointForEvent(evt, false)

      if (up) {
        this.graph.zoomIn()
      } else {
        this.graph.zoomOut()
      }

      let p2 = this.graph.getPointForEvent(evt, false)
      let deltaX = p2.x - p1.x
      let deltaY = p2.y - p1.y
      let { translate } = this.graph.view

      this.graph.view.setTranslate(translate.x + deltaX, translate.y + deltaY)

      this.graph.gridEnabled = gridEnabled

      mxEvent.consume(evt)
    }, container)
  }

  labelDisplayOveride() { // Overrides method to provide a cell label in the display
    this.graph.convertValueToString = (cell) => {
      if (mxUtils.isNode(cell.value)) {
        if (cell.value.nodeName.toLowerCase() === 'object') {
          const name = cell.getAttribute('name', '')
          return name
        }
      }
      return ''
    }

    const cellLabelChanged = this.graph.cellLabelChanged
    this.graph.cellLabelChanged = (cell, newValue) => {
      if (mxUtils.isNode(cell.value)) {
        // Clones the value for correct undo/redo
        const elt = cell.value.cloneNode(true)
        elt.setAttribute('name', newValue)
        newValue = elt
      }

      cellLabelChanged.apply(this, arguments)
    }
  }

  styling() {
    // Creates the default style for vertices
    let style = []
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter
    style[mxConstants.STYLE_STROKECOLOR] = 'gray'
    style[mxConstants.STYLE_ROUNDED] = true
    style[mxConstants.STYLE_FILLCOLOR] = '#EEEEEE'
    style[mxConstants.STYLE_GRADIENTCOLOR] = 'white'
    style[mxConstants.STYLE_FONTCOLOR] = 'black'
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE
    style[mxConstants.STYLE_FONTSIZE] = '12'
    style[mxConstants.STYLE_FONTSTYLE] = 1
    this.graph.getStylesheet().putDefaultVertexStyle(style)

    // Creates the default style for edges
    style = this.graph.getStylesheet().getDefaultEdgeStyle()
    style[mxConstants.STYLE_STROKECOLOR] = '#0C0C0C'
    style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'white'
    style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector
    style[mxConstants.STYLE_ROUNDED] = true
    style[mxConstants.STYLE_FONTCOLOR] = 'black'
    style[mxConstants.STYLE_FONTSIZE] = '10'
    this.graph.getStylesheet().putDefaultEdgeStyle(style)
  }

  addToolbarItem (graph, toolbar, prototype, image) {
    const funct = (graph, evt, cell) => {
      graph.stopEditing(false)

      const pt = graph.getPointForEvent(evt)
      const vertex = graph.getModel().cloneCell(prototype)
      vertex.geometry.x = pt.x
      vertex.geometry.y = pt.y

      graph.setSelectionCells(graph.importCells([vertex], 0, 0, cell))
    }

    const img = toolbar.addMode(null, image, funct)
    mxUtils.makeDraggable(img, graph, funct)
  }

  getJsonModel() {
    const idKeys = ['parent', 'source', 'target']
    const jsonModel = this.jsonCodec.decode(this.graph.getModel(), this.vertices)

    return JSON.stringify(
      jsonModel,
      ( key, value) => {
        if(idKeys.includes(key) && value !== null) { 
          return value.id
        }
        return value
      },
      4
    )
  }

  render(dataModel) {
    this.dataModel = dataModel
    
    this.graph.getModel().beginUpdate() // Adds cells to the model in a single step
    const root = this.graph.getDefaultParent()
    try {
      this.dataModel
        .sort((a, b)  => (a.ext.graphics.parent > b.ext.graphics.parent) ? 1 : -1)
        .map(({ ext = {}, ...config }) => {
          const node = ext.graphics
          if (node) {
            node.parent = this.graph.model.getCell(node.parent) || root

            this.vertices[node.id] = {
              node: this.graph.insertVertex(node.parent, node.id, node.value, node.xywh[0], node.xywh[1], node.xywh[2], node.xywh[3], node.type),
              config
            }

            this.vertices[node.id].config = config || {}
            
            if (node.edges) {
              node.edges.forEach(edge => {
                if (!this.edges[edge.id]) {
                  this.edges[edge.id] = edge
                }
              })
            }
          }
        })

      Object.values(this.edges).forEach(({ id, parent, source, target, value }) => {
        parent = this.graph.model.getCell(parent) || root
        this.graph.insertEdge(parent, id, value, this.vertices[source].node, this.vertices[target].node)
      })
    } finally {
      // new mxStackLayout(this.graph, true, 50, 20, 100, true).execute(parent)
      this.graph.getModel().endUpdate() // Updates the display

      // Register UNDO and REDO
      const listener = (sender, evt) => {
        this.undoManager.undoableEditHappened(evt.getProperty('edit'))
      }

      this.graph.getModel().addListener(mxEvent.UNDO, listener)
      this.graph.getView().addListener(mxEvent.UNDO, listener)

      this.graph.getModel().addListener(mxEvent.REDO, listener)
      this.graph.getView().addListener(mxEvent.REDO, listener)
    }
  }
}