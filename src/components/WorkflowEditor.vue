<template>
  <div
    id="editor"
    class="h-100 d-flex p-1"
    @keyup.8.prevent="deleteSelectedCells"
    @keyup.46.prevent="deleteSelectedCells"
  >
    <b-card
      no-body
      class="h-100 border-0 shadow-sm rounded-lg"
      style="max-width: 200px; min-width: 118px;"
    >
      <b-card-header
        class="sticky-top h5 px-2"
        header-bg-variant="white"
        header-text-variant="white"
        header-border-variant="primary"
      >
        ''
      </b-card-header>
      <b-card-body
        class="p-1"
      >
        <div
          id="toolbar"
          ref="toolbar"
          class="mt-3"
        />
        <hr>
        <div
          class="d-flex flex-column align-items-center"
        >
          <b-button
            variant="link"
            class="px-0"
            @click="$emit('save', getJsonModel())"
          >
            Save Workflow
          </b-button>
        </div>
      </b-card-body>
    </b-card>

    <b-card
      no-body
      class="w-100 h-100 border-0 shadow-sm rounded-lg ml-1"
      body-class="p-0"
    >
      <b-card-header
        class="sticky-top h5 px-2"
        header-bg-variant="white"
        header-text-variant="primary"
        header-border-variant="primary"
      >
        {{ workflow.handle }}
        <a
          href="#"
          @click="openWorkflowSettings()"
        >
          <font-awesome-icon
            :icon="['far', 'edit']"
          />
        </a>
      </b-card-header>
      <b-card-body
        class="p-0"
      >
        <div
          id="graph"
          ref="graph"
          class="h-100 p-0"
        />
      </b-card-body>
    </b-card>

    <b-sidebar
      v-model="sidebar.show"
      shadow
      right
      lazy
      no-enforce-focus
      header-class="border-bottom border-primary"
      body-class="p-2"
      footer-class="m-2 pb-1"
    >
      <template
        #header
      >
        <div>
          <h5
            class="text-primary mb-0 mr-2"
          >
            {{ getSidebarTitle }}
          </h5>
        </div>
      </template>

      <div
        v-if="getSelectedItem"
      >
        <div
          v-if="sidebar.itemType === 'workflow'"
        >
          <b-form-group
            label="Handle"
          >
            <b-form-input
              v-model="workflow.handle"
            />
          </b-form-group>
        </div>

        <b-form-group
          v-else
          label="Label"
        >
          <b-form-input
            :value="getSelectedItem.value"
            @input="setSelectedCellValue"
          />
        </b-form-group>

        <b-form-group
          label="Config"
        >
          <b-form-textarea
            v-model="getCellJSON"
            rows="10"
          />
        </b-form-group>
      </div>

      <template
        #footer
      >
         <c-input-confirm
            size="md"
            :borderless="false"
            @confirmed="sidebarDelete()"
          >
            Delete
          </c-input-confirm>
      </template>
    </b-sidebar>
  </div>
</template>

<script>
import mxgraph from "mxgraph"
import { encodeGraph, decodeToolbar } from "../lib/codec"
import toolbarConfig from "../assets/config/toolbar.json"

const {
  mxClient,
  mxGraph,
  mxEvent,
  mxUtils,
  mxCell,
  mxGeometry,
  mxUndoManager,
  mxGraphHandler,
  mxEdgeHandler,
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
    workflow: {
      type: Object,
      default: () => {},
    },
  },

  data () {
    return {
      graph: undefined,
      eventHandler: undefined,
      keyHandler: undefined,
      undoManager: undefined,
      vertices: {},
      edges: {},
      toolbar: undefined,

      edgeConnected: false,

      sidebar: {
        item: undefined,
        itemType: undefined,
        show: false,
      },
    }
  },

  computed: {
    getSelectedItem () {
      return this.sidebar.item
    },

    getSidebarTitle () {
      const { itemType } = this.sidebar
      if (itemType) {
        return itemType.charAt(0).toUpperCase() + itemType.slice(1)
      }
      return itemType
    },

    getCellJSON: {
      get () {
        let config = {}
        if (this.sidebar.itemType === 'cell') {
          config = this.vertices[this.getSelectedItem.id].config
        } else if (this.sidebar.itemType === 'edge') {
          config = this.edges[this.getSelectedItem.id].config
        }
        return JSON.stringify(config, undefined, 2)
      },

      set (value) {
        if (this.sidebar.itemType === 'cell') {
          this.vertices[this.getSelectedItem.id].config = JSON.parse(value)
        } else if (this.sidebar.itemType === 'edge') {
          this.edges[this.getSelectedItem.id].config = JSON.parse(value)
        }
      }
    }
  },

  watch: {
    workflow: {
      handler (newWorkflow) {
        if (newWorkflow.workflowID) {
          this.render(newWorkflow)
        }
      }
    },
  },

  mounted () {
    try {
      if (!mxClient.isBrowserSupported()) {
        throw new Error(mxUtils.error("Browser is not supported!", 200, false))
      }

      mxEvent.disableContextMenu(this.$refs.graph)
      this.graph = new mxGraph(this.$refs.graph)
      this.eventHandler = new mxGraphHandler(this.graph)
      this.keyHandler = new mxKeyHandler(this.graph)
      this.undoManager = new mxUndoManager()
      new mxRubberband(this.graph) // Enables multiple selection

      this.initToolbar()
      this.setup()

      this.keys()
      this.events()

      this.styling()
      this.connectionHandler()

      this.graph.container.style.background = `url("${require('../assets/grid.gif')}")`
    } catch (e) {
      console.error(e)
    }
  },

  methods: {
    openWorkflowSettings () {
      this.sidebar.itemType = 'workflow'
      this.sidebar.show = true
    },

    setSelectedCellValue (value) {
      this.graph.model.setValue(this.getSelectedItem, value)
    },

    deleteSelectedCells (evt) {
      if (this.graph.isEnabled() && evt.srcElement.className !== 'form-control') {
        this.sidebarClose()
        this.graph.removeCells()
      }
    },

    sidebarClose () {
      this.sidebar.show = false
      this.sidebar.item = undefined
      this.sidebar.itemType = undefined
    },

    sidebarDelete () {
      if (this.sidebar.itemType === 'workflow') {
        this.$emit('delete')
      } else {
        this.graph.removeCells([this.getSelectedItem])
        this.sidebarClose()
      }
    },

    setup() {
      this.graph.setPanning(true)
      this.graph.zoomFactor = 1.2

      this.graph.setConnectable(true)
      this.graph.setAllowDanglingEdges(false)
      this.graph.view.setTranslate(20, 20)

      // Enables guides
      mxGraphHandler.prototype.guidesEnabled = true
      
      // Alt disables guides
      mxGraphHandler.prototype.useGuidesForEvent = (evt) => {
        return mxEvent.isAltDown(evt.getEvent())
      }

      mxEdgeHandler.prototype.snapToTerminals = true

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

      const addTool = ({ title, icon, width, height, style, type }) => {
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
      this.keyHandler.getFunction = (evt) => {
        if (evt != null) {
          // If CTRL or META key is pressed
          if (evt.ctrlKey || (mxClient.IS_MAC && evt.metaKey)) {
            // If SHIFT key is pressed
            if (evt.shiftKey) {
              return this.keyHandler.controlShiftKeys[evt.keyCode]
            }
            return this.keyHandler.controlKeys[evt.keyCode]
          }

          // If only normal keys are pressed
          return this.keyHandler.normalKeys[evt.keyCode]
        }

        return null
      }

      // Ctrl + X
      this.keyHandler.controlKeys[88] = () => {
        if (this.graph.isEnabled()) {
          mxClipboard.cut(this.graph, this.graph.getSelectionCells())
        }
      }

      // Ctrl + C
      this.keyHandler.controlKeys[67] = () => {
        if (this.graph.isEnabled()) {
          mxClipboard.copy(this.graph, this.graph.getSelectionCells())
        }
      }

      // Ctrl + V
      this.keyHandler.controlKeys[86] = () => {
        if (this.graph.isEnabled()) {
          mxClipboard.paste(this.graph)
        }
      }

      // Ctrl + A
      this.keyHandler.controlKeys[65] = () => {
        if (this.graph.isEnabled()) {
          this.graph.selectAll()
        }
      }

      // Ctrl + Z
      this.keyHandler.controlKeys[90] = () => {
        if (this.graph.isEnabled()) {
          this.undoManager.undo()
        }
      }

      // Ctrl + Shift + Z
      this.keyHandler.controlShiftKeys[90] = () => {
        if (this.graph.isEnabled()) {
          this.undoManager.redo()
        }
      }
    },

    events() {
      // Edge connect event
      this.graph.connectionHandler.addListener(mxEvent.CONNECT, (sender, evt) => {
        const edge = evt.getProperty('cell')
        this.edges[edge.id] = {
          edge,
          config: {
            parentID: edge.source.id,
            childID: edge.source.id,
          },
        }

        this.sidebar.item = edge
        this.sidebar.itemType = 'edge'
        this.sidebar.show = true

        this.edgeConnected = true
      })

      // Click event
      this.graph.addListener(mxEvent.CLICK, (sender, evt) => {
        // Prevent click event handling if edge was just connected
        if (this.edgeConnected) {
          this.edgeConnected = false
          return
        }

        const event = evt.getProperty("event")
        const cell = evt.getProperty("cell") // cell may be null

        if (event) {
          if (mxEvent.isControlDown(event) || (mxClient.IS_MAC && mxEvent.isMetaDown(event))) {
            // Prevent sidebar opening/closing when CTRL(CMD) is pressed
          } else {
            if (cell != null) {
              this.sidebar.item = cell
              this.sidebar.itemType = cell.edge ? 'edge' : 'cell'
              this.sidebar.show = true
            } else {
              this.sidebar.show = false
              if (this.getSelectedItem) {
                this.graph.getSelectionModel().removeCell(this.getSelectedItem)
                this.sidebarClose()
              }
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
      let style = this.graph.getStylesheet().getDefaultVertexStyle()
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter
      style[mxConstants.STYLE_STROKECOLOR] = "#568ba2"
      style[mxConstants.STYLE_STROKEWIDTH] = 3
      style[mxConstants.STYLE_ROUNDED] = true
      style[mxConstants.STYLE_RESIZABLE] = false
      style[mxConstants.STYLE_FILLCOLOR] = "white"
      style[mxConstants.STYLE_FONTCOLOR] = "black"
      style[mxConstants.STYLE_FONTSIZE] = 13
      style[mxConstants.VERTEX_SELECTION_DASHED] = false
      this.graph.getStylesheet().putDefaultVertexStyle(style)

      // Creates the default style for edges
      style = this.graph.getStylesheet().getDefaultEdgeStyle()
      style[mxConstants.STYLE_STROKECOLOR] = "grey"
      style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = "white"
      style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector
      style[mxConstants.STYLE_ROUNDED] = true
      style[mxConstants.STYLE_FONTCOLOR] = "black"
      style[mxConstants.STYLE_FONTSIZE] = 11
      this.graph.getStylesheet().putDefaultEdgeStyle(style)

      // Symbol (custom shape) styling
      style = mxUtils.clone(this.graph.getStylesheet().getDefaultVertexStyle())
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter
      style[mxConstants.STYLE_FONTSIZE] = 13
      style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP
      style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_BOTTOM
      this.graph.getStylesheet().putCellStyle("symbol", style)

      // Swimlane
      style = mxUtils.clone(this.graph.getStylesheet().getDefaultVertexStyle())
      style[mxConstants.STYLE_ROUNDED] = false
      style[mxConstants.STYLE_RESIZABLE] = true
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_SWIMLANE
      style[mxConstants.STYLE_FONTSIZE] = 15
      style[mxConstants.STYLE_HORIZONTAL] = false
      style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_MIDDLE
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE
      style[mxConstants.STYLE_STROKEWIDTH] = 2
      delete style[mxConstants.STYLE_FILLCOLOR]
      this.graph.getStylesheet().putCellStyle("swimlane", style)
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

        const [newCell] = graph.importCells([vertex], 0, 0, cell)

        this.vertices[newCell.id] = {
          node: newCell,
          config: {
            stepID: newCell.id,
            kind: '',
            ref: '',
            arguments: null,
            results: null
          },
        }

        graph.setSelectionCells([newCell])
        this.sidebar.item = this.vertices[newCell.id].node
        this.sidebar.itemType = 'cell'
        this.sidebar.show = true
       }

      const img = toolbar.addMode(title, icon, funct)
      mxUtils.makeDraggable(img, graph, funct)
    },

    getJsonModel () {
      const idKeys = ['parent', 'source', 'target']
      return encodeGraph(this.graph.getModel(), this.vertices, this.edges)

      // return jsonModel.map(step => {
      //   const visual = {}
      //   Object.entries(step.meta.visual).forEach(([key, value]) => {
      //     if (idKeys.includes(key) && value !== null) {
      //       visual[key] = value.id
      //     } else {
      //       visual[key] = value
      //     }
      //   })
      //   step.meta.visual = visual
      //   return step
      // })
    },

    render (workflow) {
      this.graph.model.clear()

      const steps = workflow.steps || []
      const paths = workflow.paths || []
      const root = this.graph.getDefaultParent()

      this.graph.getModel().beginUpdate() // Adds cells to the model in a single step

      try {
        // Add nodes
        steps.forEach(({ meta = {}, ...config }) => {
          const node = meta.visual
          if (node) {
            node.parent = this.graph.model.getCell(node.parent) || root

            this.vertices[node.id] = {
              node: this.graph.insertVertex(node.parent, node.id, node.value, node.xywh[0], node.xywh[1], node.xywh[2], node.xywh[3], node.type),
              config
            }
          }
        })

        // Add edges
        paths.forEach(({ meta, ...config }) => {
          const edge = meta.visual
          if (edge) {
            edge.parent = this.graph.model.getCell(edge.parent) || root

            this.edges[edge.id] = {
              edge: this.graph.insertEdge(edge.parent, edge.id, edge.value, this.vertices[edge.source].node, this.vertices[edge.target].node),
              config
            }
          }
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

<style scoped lang="scss">
#graph {
  outline: none;
}

.wf-info {
  position: absolute;
  top: 0;
  left: 0;
}
</style>

<style>
.b-sidebar {
  margin-top: 0.25rem !important;
}

.b-sidebar > .b-sidebar-header {
  padding: 0.75rem 0.5rem !important;
}
</style>
