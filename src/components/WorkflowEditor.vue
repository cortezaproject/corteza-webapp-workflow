<template>
  <div
    id="editor"
    class="h-100 d-flex p-1"
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
        <router-link
          :to="{name: 'workflow.list'}"
          class="mr-2"
        >
          <font-awesome-icon
            :icon="['fas', 'home']"
          />
        </router-link>
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
        {{ workflow.meta.name || workflow.handle }}
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
      width="25vw"
      header-class="bg-white border-bottom border-primary"
      body-class="bg-white"
      footer-class="bg-white p-2 border-top border-primary"
    >
      <template
        #header
      >
        <div>
          <h5
            class="text-primary mb-0 mr-2"
          >
            {{ getSidebarItemType }}
          </h5>
        </div>
      </template>

      <configurator
        v-if="sidebar.item"
        :item.sync="sidebar.item"
        :edges.sync="edges"
      />

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
import { encodeGraph } from "../lib/codec"
import { getStyleFromKind, getKindFromStyle } from "../lib/style"
import toolbarConfig from "../assets/config/toolbar.js"
import Configurator from '../components/Configurator'

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
  mxParallelEdgeLayout,
  mxPoint,
  mxCellEditor,
} = mxgraph()

export default {
  name: 'WorkflowEditor',

  components: {
    Configurator
  },

  props: {
    workflow: {
      type: Object,
      default: () => {},
    },

    triggers: {
      type: Array,
      default: () => [],
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
      // edgeLayout: undefined,

      rendering: false,

      sidebar: {
        item: undefined,
        itemType: undefined,
        show: false,
      },
    }
  },

  computed: {
    getSidebarItemType () {
      const { itemType } = this.sidebar
      if (itemType) {
        return itemType.charAt(0).toUpperCase() + itemType.slice(1)
      }
      return itemType
    },

    getSelectedItem () {
      return this.sidebar.item ? this.sidebar.item : undefined
    },
  },

  watch: {
    workflow: {
      handler (newWorkflow) {
        if (newWorkflow.workflowID) {
          this.render(newWorkflow)
        }
      }
    },

    'sidebar.item': {
      deep: true,
      handler (item) {
        if (item && !item.workflowID) {
          const { value } = item.node
          this.graph.model.setValue(item.node, value)
        }
      }
    },
  },

  mounted () {
    try {
      if (!mxClient.isBrowserSupported()) {
        throw new Error(mxUtils.error('Browser is not supported!', 200, false))
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

      this.graph.container.style.background = 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QwZDBkMCIgb3BhY2l0eT0iMC4yIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDBkMGQwIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=")'

      this.render(this.workflow)
    } catch (e) {
      console.error(e)
    }
  },

  methods: {
    openWorkflowSettings () {
      this.sidebar.itemType = 'workflow'
      this.sidebar.item = this.workflow
      this.sidebar.show = true
    },

    deleteSelectedCells () {
      this.sidebarClose()
      this.graph.removeCells()
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
        if (this.getSelectedItem) {
          this.graph.removeCells([this.getSelectedItem.node])
          this.sidebarClose()
        }
      }
    },

    setup() {
      this.graph.setPanning(true)
      this.graph.zoomFactor = 1.2

      this.graph.setConnectable(true)
      this.graph.setAllowDanglingEdges(false)
      this.graph.view.setTranslate(10, 10)

      // Enables guides
      mxGraphHandler.prototype.guidesEnabled = true
      
      // Alt disables guides
      mxGraphHandler.prototype.useGuidesForEvent = (evt) => {
        return mxEvent.isAltDown(evt.getEvent())
      }

      mxEdgeHandler.prototype.snapToTerminals = true

      // this.edgeLayout = new mxParallelEdgeLayout(this.graph)
      // this.edgeLayout.isEdgeIgnored = (edge) => {
      //   return (edge.geometry.points || []).length
      // }

      // Register UNDO and REDO
      const listener = (sender, evt) => {
        this.undoManager.undoableEditHappened(evt.getProperty('edit'))
      }

      this.graph.getModel().addListener(mxEvent.UNDO, listener)
      this.graph.getView().addListener(mxEvent.UNDO, listener)

      this.graph.getModel().addListener(mxEvent.REDO, listener)
      this.graph.getView().addListener(mxEvent.REDO, listener)

      if (mxClient.IS_QUIRKS) {
        document.body.style.overflow = 'hidden'
        new mxDivResizer(this.graph.container)
      }

      if (mxClient.IS_NS) {
        mxEvent.addListener(this.graph.container, 'mousedown', () => {
          if (!this.graph.isEditing()) {
            this.graph.container.setAttribute('tabindex', '-1')
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

      const addCell = ({ title, icon, width = 60, height = 60, style }) => {
        const cell = new mxCell(
          null,
          new mxGeometry(0, 0, width, height),
          style
        )
        cell.setVertex(true)

        this.addToolbarItem(title, this.graph, this.toolbar, cell, icon)
      }

      toolbarConfig.forEach(cell => {
        if (cell.kind === 'line') {
          this.toolbar.addLine()
        } else if (cell.kind === 'break') {
          this.toolbar.addBreak()
        } else {
          const cellStyle = getStyleFromKind(cell)
          if (cellStyle) {
            addCell({
              ...cell,
              ...cellStyle
            })
          }
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

      // Backspace
      this.keyHandler.normalKeys[8] = () => {
        if (this.graph.isEnabled()) {
          this.deleteSelectedCells()
        }
      }

      // Delete
      this.keyHandler.normalKeys[46] = () => {
        if (this.graph.isEnabled()) {
          this.deleteSelectedCells()
        }
      }
    },

    events() {
      // Edge connect event
      this.graph.connectionHandler.addListener(mxEvent.CONNECT, (sender, evt) => {
        const node = evt.getProperty('cell')
        this.edges[node.id] = {
          node,
          config: {
            parentID: node.source.id,
            childID: node.source.id,
          },
        }

        const source = this.vertices[node.source.id]
        const target = this.vertices[node.target.id]
        const outPaths = source.node.edges.filter(e => e.source.id === source.node.id) || []

        if (source.config.kind === 'gateway') {
          if (['join', 'fork'].includes(source.config.ref)) {
            this.updateVertexConfig(source.node.id)
          }
  
          if (source.config.ref === 'excl') {
            this.edges[node.id].node.value = `#${outPaths.length} - ${outPaths.length === 1 ? 'If' : 'Else (if)'}`
          }
        } else if (source.config.kind === 'error-handler') {
          this.edges[node.id].node.value = `#${outPaths.length} - ${outPaths.length === 1 ? 'Catch' : 'Try'}`
        } else if (source.config.kind === 'iterator') {
          this.edges[node.id].node.value = `#${outPaths.length} - ${outPaths.length === 1 ? 'Loop body' : 'Loop end'}`
        }

        // this.sidebar.item = this.edges[node.id]
        // this.sidebar.itemType = 'edge'
        // this.sidebar.show = true


        // this.edgeLayout.execute(this.graph.getDefaultParent())
        this.edgeConnected = true
      })


      this.graph.addListener(mxEvent.CELLS_ADDED, (sender, evt) => {
        const [cell] = evt.getProperty('cells')
        if (cell && cell.vertex) {
          if (!this.rendering) {
            this.addCellToVertices(cell)
            this.graph.setSelectionCells([cell])
            this.sidebar.item = this.vertices[cell.id]
            this.sidebar.itemType = this.vertices[cell.id].config.kind
            this.sidebar.show = true
          }
        }
      })

      this.graph.addListener(mxEvent.CELLS_REMOVED, (sender, evt) => {
        const cells = evt.getProperty('cells') || []
        cells.filter(({ edge }) => edge)
          .forEach(({ source, target }) => {
            source = this.vertices[source.id]
            target = this.vertices[target.id]

            if (source.config.kind === 'gateway') {
              this.graph.removeCells(source.node.edges.filter(e => e.source.id === source.node.id))
              if (['join', 'fork'].includes(target.config.ref)) {
                this.updateVertexConfig(source.node.id)
              }
            } else if (source.config.kind === 'iterator') {
              this.graph.removeCells(source.node.edges.filter(e => e.source.id === source.node.id))
            }  else if (source.config.kind === 'error-handler') {
              this.graph.removeCells(source.node.edges.filter(e => e.source.id === source.node.id))
            }

            if (target.config.kind === 'gateway') {
              if (['join', 'fork'].includes(target.config.ref)) {
                this.updateVertexConfig(target.node.id)
              }
            }
          })
      })

      // Click event
      this.graph.addListener(mxEvent.CLICK, (sender, evt) => {
        // Prevent click event handling if edge was just connected
        if (this.edgeConnected) {
          this.edgeConnected = false
          return
        }

        const event = evt.getProperty('event')
        const cell = evt.getProperty('cell') // cell may be null

        if (event) {
          if (mxEvent.isControlDown(event) || (mxClient.IS_MAC && mxEvent.isMetaDown(event))) {
            // Prevent sidebar opening/closing when CTRL(CMD) is pressed while clicking
          } else {
            if (cell != null) {
              this.sidebar.item = cell.edge ? this.edges[cell.id] : this.vertices[cell.id]
              this.sidebar.itemType = cell.edge ? 'edge' : this.vertices[cell.id].config.kind
              this.sidebar.show = true
            } else {
              this.sidebar.show = false
              if (this.getSelectedItem) {
                this.graph.getSelectionModel().removeCell(this.getSelectedItem.node)
                this.sidebarClose()
              }
            }
          }
        }

        evt.consume()
      })

      // Doubleclick event
      this.graph.addListener(mxEvent.CLICK, (sender, evt) => {
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
      style[mxConstants.STYLE_STROKECOLOR] = '#568ba2'
      style[mxConstants.STYLE_STROKEWIDTH] = 3
      style[mxConstants.STYLE_ROUNDED] = true
      style[mxConstants.STYLE_RESIZABLE] = false
      style[mxConstants.STYLE_FILLCOLOR] = 'white'
      style[mxConstants.STYLE_FONTCOLOR] = 'black'
      style[mxConstants.STYLE_FONTSIZE] = 13
      style[mxConstants.VERTEX_SELECTION_DASHED] = false
      this.graph.getStylesheet().putDefaultVertexStyle(style)

      // Creates the default style for edges
      style = this.graph.getStylesheet().getDefaultEdgeStyle()
      style[mxConstants.STYLE_STROKECOLOR] = 'grey'
      style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'white'
      style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector
      style[mxConstants.STYLE_ROUNDED] = true
      style[mxConstants.STYLE_FONTCOLOR] = 'black'
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
      this.graph.getStylesheet().putCellStyle('symbol', style)

      // Function
      style = mxUtils.clone(this.graph.getStylesheet().getCellStyle('symbol'))
      style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE
      style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_MIDDLE
      this.graph.getStylesheet().putCellStyle('function', style)

      // Iterator
      style = mxUtils.clone(this.graph.getStylesheet().getCellStyle('symbol'))
      this.graph.getStylesheet().putCellStyle('iterator', style)

      // Event
      style = mxUtils.clone(this.graph.getStylesheet().getCellStyle('symbol'))
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.EllipsePerimeter
      this.graph.getStylesheet().putCellStyle('event', style)

      // Error handler
      style = mxUtils.clone(this.graph.getStylesheet().getCellStyle('event'))
      this.graph.getStylesheet().putCellStyle('error-handler', style)

      // Gateway
      style = mxUtils.clone(this.graph.getStylesheet().getCellStyle('symbol'))
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RhombusPerimeter
      style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_TOP
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_BOTTOM
      this.graph.getStylesheet().putCellStyle('gateway', style)

      // Expression
      style = mxUtils.clone(this.graph.getStylesheet().getCellStyle('symbol'))
      this.graph.getStylesheet().putCellStyle('expressions', style)

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
      this.graph.getStylesheet().putCellStyle('swimlane', style)
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
        let vertex = graph.getModel().cloneCell(prototype)
        vertex.geometry.x = pt.x
        vertex.geometry.y = pt.y

        const [newCell] = graph.importCells([vertex], 0, 0, cell)
       }

      const img = toolbar.addMode(title, icon, funct)
      mxUtils.makeDraggable(img, graph, funct)
    },

    addCellToVertices (cell) {
      const triggers = this.triggers.find(({ meta }) => {
        return ((meta || {}).visual || {}).id === cell.id
      })

      const config = (this.workflow.steps || []).find(({ stepID }) => {
        return stepID === cell.id
      }) || {}

      this.vertices[cell.id] = {
        node: cell,
        config: {
          stepID: cell.id,
          kind: config.kind || '',
          ref: config.ref || '',
          ...(this.rendering ? {} : getKindFromStyle(cell))
        },
      }

      if (config.arguments) {
        this.vertices[cell.id].config.arguments = config.arguments
      }

      if (config.results) {
        this.vertices[cell.id].config.results = config.results
      }

      if (triggers) {
        this.vertices[cell.id].triggers = triggers
      }
    },

    updateVertexConfig (vID) {
      const { node, config } = this.vertices[vID]
      this.vertices[vID].config = { ...config, ...(this.rendering ? {} : getKindFromStyle(node)) }
    },

    render (workflow) {
      this.rendering = true
      this.graph.model.clear()

      if (!this.workflow.steps) {
        this.workflow.steps = []
      }

      if (!this.workflow.paths) {
        this.workflow.paths = []
      }

      // Add triggers to steps/paths
      this.triggers.forEach(({ meta, ...config }) => {
        this.workflow.steps.push({
          stepID: meta.visual.id,
          kind: 'trigger',
          meta
        })

        meta.visual.edges.forEach(edge => {
          this.workflow.paths.push(edge)
        })
      })

      const steps = workflow.steps || []
      const paths = workflow.paths || []
      const root = this.graph.getDefaultParent()

      this.vertices = {}
      this.edges = {}

      this.graph.getModel().beginUpdate() // Adds cells to the model in a single step

      try {
        // Add nodes
        steps.sort((a, b) => a.meta.visual.parent - b.meta.visual.parent)
          .forEach(({ meta = {}, ...config }) => {
            const node = (meta || {}).visual
            if (node) {
              node.parent = this.graph.model.getCell(node.parent) || root
 
              let { width, height, style } = getStyleFromKind(config)

              const newCell = this.graph.insertVertex(node.parent, node.id, node.value, node.xywh[0], node.xywh[1], node.xywh[2] || width, node.xywh[3] || height, style)
              this.addCellToVertices(newCell)
            }
          })

        // Add edges
        paths.forEach(({ meta, ...config }) => {
          const edge = (meta || {}).visual
          if (edge) {
            edge.parent = this.graph.model.getCell(edge.parent) || root

            const newEdge = this.graph.insertEdge(edge.parent, edge.id, edge.value, this.vertices[edge.source].node, this.vertices[edge.target].node)
            newEdge.geometry.points = (edge.points || []).map(({ x, y }) => {
              return new mxPoint(x, y)
            })

            this.edges[edge.id] = {
              node: newEdge,
              config
            }
          }
        })

        // Updates vertices now that edges are present
        Object.keys(this.vertices).forEach(vID => this.updateVertexConfig(vID))
      } finally {
        // this.edgeLayout.execute(this.graph.getDefaultParent())

        this.graph.getModel().endUpdate() // Updates the display

        this.rendering = false
      }
    },

    getJsonModel () {
      return encodeGraph(this.graph.getModel(), this.vertices, this.edges)
    }
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
  padding-top: 0.25rem !important;
}

.b-sidebar > .b-sidebar-header {
  padding: 0.75rem 0.5rem !important;
}
</style>
