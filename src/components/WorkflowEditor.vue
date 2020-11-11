<template>
  <div class="h-100 d-flex flex-row px-1 py-2">
    <b-card header="Tools" style="max-width: 100px" body-class="p-1">
      <div id="toolbar" ref="toolbar" />
      <b-button variant="link" @click="$emit('save', getJsonModel())"> To JSON </b-button>
    </b-card>
    <b-card-body
      id="graph"
      ref="graph"
      class="card h-100 flex-grow-1 ml-1 p-0"
    />
    <b-sidebar
      v-model="sidebar.show"
      title="Sidebar"
      shadow
      right
    >
      {{ sidebar.selectedCell }}
    </b-sidebar>
  </div>
</template>

<script>
import mxgraph from "mxgraph"
import { decodeGraph, decodeToolbar } from "../lib/codec"
import toolbarConfig from "../assets/config/toolbar.json"

const {
  mxClient,
  mxGraph,
  mxEvent,
  mxUtils,
  mxCell,
  mxGeometry,
  mxUndoManager,
  mxKeyHandler,
  mxDivResizer,
  mxToolbar,
  mxConstants,
  mxDragSource,
  mxRubberband,
  mxPerimeter,
  mxEdgeStyle,
  mxConnectionHandler,
} = mxgraph()

let graphObject = undefined
let keyhandler = undefined
let undoManager = undefined
let vertices = {}
let edges = {}
let toolbar = {}

export default {
  name: "WorkflowEditor",

  props: {
    model: {
      type: Array,
      default: () => [],
    },
  },

  data () {
    return {
      sidebar: {
        selectedCell: undefined,
        show: false,
      },
    }
  },

  mounted () {
    try {
      if (!mxClient.isBrowserSupported()) {
        throw new Error(mxUtils.error("Browser is not supported!", 200, false))
      }

      mxEvent.disableContextMenu(this.$refs.graph)
      graphObject = new mxGraph(this.$refs.graph)
      keyhandler = new mxKeyHandler(graphObject)
      undoManager = new mxUndoManager()

      this.initToolbar()
      this.setup()

      this.keys()
      this.events()

      this.styling()
      this.connectionHandler()

      graphObject.container.style.background = `url("${require('../assets/grid.gif')}")`

      this.render(JSON.parse(localStorage.getItem('graph')))
    } catch (e) {
      console.error(e)
    }
  },

  methods: {
    setup() {
      graphObject.setPanning(true)
      graphObject.zoomFactor = 1.1

      graphObject.setConnectable(true)
      graphObject.setAllowDanglingEdges(false)
      new mxRubberband(graphObject) // Enables rubberband selection
      graphObject.view.setTranslate(20, 20)

      if (mxClient.IS_QUIRKS) {
        document.body.style.overflow = "hidden"
        new mxDivResizer(graphObject.container)
      }

      if (mxClient.IS_NS) {
        mxEvent.addListener(graphObject.container, "mousedown", () => {
          if (!graphObject.isEditing()) {
            graphObject.container.setAttribute("tabindex", "-1")
            graphObject.container.focus()
          }
        })
      }
    },

    initToolbar() {
      toolbar = new mxToolbar(this.$refs.toolbar)
      graphObject.dropEnabled = true

      // Matches DnD inside the this.editor.
      mxDragSource.prototype.getDropTarget = (graph, x, y) => {
        let cell = graph.getCellAt(x, y)

        if (!graph.isValidDropTarget(cell)) {
          cell = null
        }

        return cell
      }

      const addTool = ({ title, icon, width, height, style }) => {
        const tool = new mxCell(
          null,
          new mxGeometry(0, 0, width, height),
          style
        )
        tool.setVertex(true)

        this.addToolbarItem(title, graphObject, toolbar, tool, icon)
      }

      decodeToolbar(toolbarConfig).forEach((tool) => {
        if (tool.line) {
          toolbar.addLine()
        } else if (tool.break) {
          toolbar.addBreak()
        } else {
          addTool(tool)
        }
      })
    },

    keys() {
      // Register control and meta key if Mac
      keyhandler.getFunction = (evt) => {
        if (evt != null) {
          // If CTRL or META key is pressed
          if (evt.ctrlKey || (mxClient.IS_MAC && evt.metaKey)) {
            // If SHIFT key is pressed
            if (evt.shiftKey) {
              return keyhandler.controlShiftKeys[evt.keyCode]
            }
            return keyhandler.controlKeys[evt.keyCode]
          }

          // If only normal keys are pressed
          return keyhandler.normalKeys[evt.keyCode]
        }

        return null
      }

      const deleteCells = () => {
        if (graphObject.isEnabled()) {
          graphObject.removeCells()
        }
      }

      // Backspace
      keyhandler.normalKeys[8] = deleteCells
      // Delete
      keyhandler.normalKeys[46] = deleteCells

      // Ctrl + A
      keyhandler.controlKeys[65] = () => {
        if (graphObject.isEnabled()) {
          graphObject.selectAll()
        }
      }

      // Ctrl + Z
      keyhandler.controlKeys[90] = () => {
        if (graphObject.isEnabled()) {
          undoManager.undo()
        }
      }

      // Ctrl + Shift + Z
      keyhandler.controlShiftKeys[90] = () => {
        if (graphObject.isEnabled()) {
          undoManager.redo()
        }
      }
    },

    events() {
      // Click event
      graphObject.addListener(mxEvent.CLICK, (sender, evt) => {
        const cell = evt.getProperty("cell") // cell may be null
        if (cell != null) {
          console.log(cell)
          this.sidebar.selectedCell = {
            cellID: cell.id,
          }
          this.sidebar.show = true
        }

        evt.consume()
      })

      // Zoom event
      mxEvent.addMouseWheelListener((evt, up) => {
        if (mxEvent.isConsumed(evt)) {
          return
        }

        if (mxEvent.isControlDown(evt)) {
          return
        }

        let gridEnabled = graphObject.gridEnabled

        graphObject.gridEnabled = false

        let p1 = graphObject.getPointForEvent(evt, false)

        if (up) {
          graphObject.zoomIn()
        } else {
          graphObject.zoomOut()
        }

        let p2 = graphObject.getPointForEvent(evt, false)
        let deltaX = p2.x - p1.x
        let deltaY = p2.y - p1.y
        let { translate } = graphObject.view

        graphObject.view.setTranslate(
          translate.x + deltaX,
          translate.y + deltaY
        )

        graphObject.gridEnabled = gridEnabled

        mxEvent.consume(evt)
      }, graphObject.container)
    },

    styling() {
      // Creates the default style for vertices
      let style = []
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter
      style[mxConstants.STYLE_STROKECOLOR] = "gray"
      style[mxConstants.STYLE_ROUNDED] = true
      style[mxConstants.STYLE_FILLCOLOR] = "#EEEEEE"
      style[mxConstants.STYLE_GRADIENTCOLOR] = "white"
      style[mxConstants.STYLE_FONTCOLOR] = "black"
      style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE
      style[mxConstants.STYLE_FONTSIZE] = "12"
      style[mxConstants.STYLE_FONTSTYLE] = 1
      style[mxConstants.OUTLINE_HIGHLIGHT_COLOR] = "#EEEEEE"
      graphObject.getStylesheet().putDefaultVertexStyle(style)

      // Creates the default style for edges
      style = graphObject.getStylesheet().getDefaultEdgeStyle()
      style[mxConstants.STYLE_STROKECOLOR] = "#0C0C0C"
      style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = "white"
      style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector
      style[mxConstants.STYLE_ROUNDED] = true
      style[mxConstants.STYLE_FONTCOLOR] = "black"
      style[mxConstants.STYLE_FONTSIZE] = "10"
      graphObject.getStylesheet().putDefaultEdgeStyle(style)

      // Symbol (custom shape) styling
      style = []
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter
      style[mxConstants.STYLE_FONTSIZE] = "12"
      style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP
      style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_BOTTOM
      style[mxConstants.STYLE_RESIZABLE] = "0"
      graphObject.getStylesheet().putCellStyle("symbol", style)
    },

    connectionHandler() {
      mxConstants.DEFAULT_HOTSPOT = 0.4

      new mxConnectionHandler(graphObject, (source, target, style) => {
        const edge = new mxCell('', new mxGeometry())
        edge.setEdge(true)
        edge.setStyle(style)
        edge.geometry.relative = true
        return edge
      })
    },

    addToolbarItem(title, graph, toolbar, prototype, icon) {
      const funct = (graph, evt, cell) => {
        graph.stopEditing(false)

        const pt = graph.getPointForEvent(evt)
        const vertex = graph.getModel().cloneCell(prototype)
        vertex.geometry.x = pt.x
        vertex.geometry.y = pt.y

        graph.setSelectionCells(graph.importCells([vertex], 0, 0, cell))
      }

      const img = toolbar.addMode(title, icon, funct)
      mxUtils.makeDraggable(img, graph, funct)
    },

    getJsonModel () {
      const idKeys = ['parent', 'source', 'target']
      const jsonModel = decodeGraph(graphObject.getModel(), vertices)

      return JSON.stringify(
        jsonModel,
        (key, value) => {
          if (idKeys.includes(key) && value !== null) {
            return value.id
          }
          return value
        },
        4
      )
    },

    render (dataModel) {
      graphObject.getModel().beginUpdate() // Adds cells to the model in a single step
      const root = graphObject.getDefaultParent()
      try {
        dataModel
          .sort((a, b) => (a.ext.graphics.parent > b.ext.graphics.parent) ? 1 : -1)
          .map(({ ext = {}, ...config }) => {
            const node = ext.graphics
            if (node) {
              node.parent = graphObject.model.getCell(node.parent) || root

              vertices[node.id] = {
                node: graphObject.insertVertex(node.parent, node.id, node.value, node.xywh[0], node.xywh[1], node.xywh[2], node.xywh[3], node.type),
                config
              }

              vertices[node.id].config = config || {}

              if (node.edges) {
                node.edges.forEach(edge => {
                  if (!edges[edge.id]) {
                    edges[edge.id] = edge
                  }
                })
              }
            }
          })

        Object.values(edges).forEach(({ id, parent, source, target, value }) => {
          parent = graphObject.model.getCell(parent) || root
          graphObject.insertEdge(parent, id, value, vertices[source].node, vertices[target].node)
        })
      } finally {
        graphObject.getModel().endUpdate() // Updates the display

        // Register UNDO and REDO
        const listener = (sender, evt) => {
          undoManager.undoableEditHappened(evt.getProperty('edit'))
        }

        graphObject.getModel().addListener(mxEvent.UNDO, listener)
        graphObject.getView().addListener(mxEvent.UNDO, listener)

        graphObject.getModel().addListener(mxEvent.REDO, listener)
        graphObject.getView().addListener(mxEvent.REDO, listener)
      }
    },
  },
}
</script>
