<template>
  <div
    id="editor"
    class="h-100 d-flex flex-row px-1 py-2"
    @keyup.8.prevent="deleteSelectedCells"
    @keyup.46.prevent="deleteSelectedCells"
  >
    <b-card
      header="Tools"
      style="max-width: 200px; min-width: 105px;"
      body-class="p-1"
      header-class="text-center"
    >
      <div
        id="toolbar"
        ref="toolbar"
        class="mt-3"
      />
      <hr>
      <div
        class="d-flex align-items-center"
      >
        <b-button
          variant="link"
          class="w-100"
          @click="$emit('save', getJsonModel())"
        >
          To JSON
        </b-button>
      </div>
    </b-card>
    <div
      id="graph"
      ref="graph"
      class="h-100 flex-grow-1 ml-1 p-0"

    />
    <b-sidebar
      v-if="getSelectedCell"
      v-model="sidebar.show"
      shadow
      right
      lazy
      header-class="p-2 pb-0 mt-3 mw-25"
    >
      <template #header>
        <h3
          class="mb-0"
        >
          {{ getSelectedCell.vertex ? 'Step' : 'Edge' }}
        </h3>
      </template>

      <hr>

      <div
        class="px-2"
      >
        <b-form-group
          label="Label"
        >
          <b-form-input
            :value="getSelectedCell.value"
            @input="setSelectedCellValue"
          />
        </b-form-group>
      </div>
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
  mxClipboard,
} = mxgraph()

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
      graph: undefined,
      keyhandler: undefined,
      undoManager: undefined,
      vertices: {},
      edges: {},
      toolbar: undefined,

      sidebar: {
        selectedCell: undefined,
        show: false,
      },
    }
  },

  computed: {
    getSelectedCell () {
      if (this.sidebar.selectedCell) {
        return this.graph.model.getCell(this.sidebar.selectedCell.cellID)
      }
      return undefined
    },
  },

  mounted () {
    try {
      if (!mxClient.isBrowserSupported()) {
        throw new Error(mxUtils.error("Browser is not supported!", 200, false))
      }

      mxEvent.disableContextMenu(this.$refs.graph)
      this.graph = new mxGraph(this.$refs.graph)
      this.keyhandler = new mxKeyHandler(this.graph)
      this.undoManager = new mxUndoManager()

      this.initToolbar()
      this.setup()

      this.keys()
      this.events()

      this.styling()
      this.connectionHandler()

      this.graph.container.style.background = `url("${require('../assets/grid.gif')}")`

      this.render(this.model)
    } catch (e) {
      console.error(e)
    }
  },

  methods: {
    setSelectedCellValue (value) {
      this.graph.model.setValue(this.getSelectedCell, value)
    },

    deleteSelectedCells (evt) {
      if (this.graph.isEnabled() && evt.srcElement.className !== 'form-control') {
        this.sidebar.show = false
        this.graph.removeCells()
      }
    },

    setup() {
      this.graph.setPanning(true)
      this.graph.zoomFactor = 1.1

      this.graph.setConnectable(true)
      this.graph.setAllowDanglingEdges(false)
      new mxRubberband(this.graph) // Enables rubberband selection
      this.graph.view.setTranslate(20, 20)

      if (mxClient.IS_QUIRKS) {
        document.body.style.overflow = "hidden"
        new mxDivResizer(this.graph.container)
      }

      if (mxClient.IS_NS) {
        mxEvent.addListener(this.graph.container, "mousedown", () => {
          if (!this.graph.isEditing()) {
            this.graph.container.setAttribute("tabindex", "-1")
          }
        })
      }
    },

    initToolbar() {
      this.toolbar = new mxToolbar(this.$refs.toolbar)
      this.graph.dropEnabled = true

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

        this.addToolbarItem(title, this.graph, this.toolbar, tool, icon)
      }

      decodeToolbar(toolbarConfig).forEach((tool) => {
        if (tool.line) {
          this.toolbar.addLine()
        } else if (tool.break) {
          this.toolbar.addBreak()
        } else {
          addTool(tool)
        }
      })
    },

    keys() {
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

      // Ctrl + X
      this.keyhandler.controlKeys[88] = () => {
        if (this.graph.isEnabled()) {
          mxClipboard.cut(this.graph, this.graph.getSelectionCells())
        }
      }

      // Ctrl + C
      this.keyhandler.controlKeys[67] = () => {
        if (this.graph.isEnabled()) {
          mxClipboard.copy(this.graph, this.graph.getSelectionCells())
        }
      }

      // Ctrl + V
      this.keyhandler.controlKeys[86] = () => {
        if (this.graph.isEnabled()) {
          mxClipboard.paste(this.graph)
        }
      }

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
    },

    events() {
      // Click event
      this.graph.addListener(mxEvent.CLICK, (sender, evt) => {
        // If CTRL/CMD key is pressed
        const event = evt.getProperty("event")
        const cell = evt.getProperty("cell") // cell may be null
        if (event) {
          if (mxEvent.isControlDown(event) || (mxClient.IS_MAC && mxEvent.isMetaDown(event))) {
          } else {
            if (cell != null) {
              this.sidebar.selectedCell = {
                cellID: cell.id,
              }
              this.sidebar.show = true
            } else {
              if (this.getSelectedCell) {
                this.graph.getSelectionModel().removeCell(this.getSelectedCell)
                this.sidebar.selectedCell = undefined
              }
              this.sidebar.show = false
            }
          }
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

        this.graph.view.setTranslate(
          translate.x + deltaX,
          translate.y + deltaY
        )

        this.graph.gridEnabled = gridEnabled

        mxEvent.consume(evt)
      }, this.graph.container)
    },

    styling() {
      // Creates the default style for vertices
      let style = []
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter
      style[mxConstants.STYLE_STROKECOLOR] = "#568ba2"
      style[mxConstants.STYLE_STROKEWIDTH] = 3

      
      style[mxConstants.STYLE_ROUNDED] = true
      style[mxConstants.STYLE_FILLCOLOR] = "white"
      style[mxConstants.STYLE_FONTCOLOR] = "black"
      style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE
      style[mxConstants.STYLE_FONTSIZE] = "12"
      style[mxConstants.STYLE_FONTSTYLE] = 1
      style[mxConstants.OUTLINE_HIGHLIGHT_COLOR] = "#EEEEEE"
      this.graph.getStylesheet().putDefaultVertexStyle(style)

      // Creates the default style for edges
      style = this.graph.getStylesheet().getDefaultEdgeStyle()
      style[mxConstants.STYLE_STROKECOLOR] = "grey"
      style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = "white"
      style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector
      style[mxConstants.STYLE_ROUNDED] = true
      style[mxConstants.STYLE_FONTCOLOR] = "black"
      style[mxConstants.STYLE_FONTSIZE] = "10"
      this.graph.getStylesheet().putDefaultEdgeStyle(style)

      // Symbol (custom shape) styling
      style = []
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter
      style[mxConstants.STYLE_FONTSIZE] = "12"
      style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP
      style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_BOTTOM
      style[mxConstants.STYLE_RESIZABLE] = "0"
      this.graph.getStylesheet().putCellStyle("symbol", style)
    },

    connectionHandler() {
      mxConstants.DEFAULT_HOTSPOT = 0.4

      new mxConnectionHandler(this.graph, (source, target, style) => {
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
      const jsonModel = decodeGraph(this.graph.getModel(), this.vertices)

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
      this.graph.getModel().beginUpdate() // Adds cells to the model in a single step
      const root = this.graph.getDefaultParent()
      try {
        dataModel
          .sort((a, b) => (a.ext.graphics.parent > b.ext.graphics.parent) ? 1 : -1)
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
    },
  },
}
</script>

<style>
#graph {
  outline: none;
}
</style>
