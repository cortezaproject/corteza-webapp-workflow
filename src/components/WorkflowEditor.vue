<template>
  <div
    id="editor"
    class="h-100 d-flex p-1"
  >
    <link rel="stylesheet" href="path/to/font-awesome/css/font-awesome.min.css">
    <b-card
      no-body
      no-footer
      class="h-100 border-right shadow-lg rounded-0"
    >
      <b-card-header
        class="d-flex flex-column justify-content-between align-items-center sticky-top h4 p-2"
        header-bg-variant="white"
        header-text-variant="white"
        header-border-variant="primary"
      >
        <b-img
          :src="getLogo"
          class="mb-4"
        />
        <router-link
          :to="{name: 'workflow.list'}"
        >
          <font-awesome-icon
            :icon="['fas', 'home']"
          />
        </router-link>
      </b-card-header>
      <b-card-body
        class="d-flex flex-column p-1"
      >
        <div
          id="toolbar"
          ref="toolbar"
          class="d-flex flex-column align-items-center mt-1"
        />

        <div
          class="d-flex flex-grow-1 align-items-start justify-content-center p-3"
        >
          <a
            href="#"
            class="h4 mb-0"
            v-b-modal.help
          >
            <font-awesome-icon
              :icon="['far', 'question-circle']"
            />
          </a>
        </div>
      </b-card-body>
    </b-card>

    <div
      ref="tooltips"
      class="mh-100"
    />

    <b-card
      no-body
      no-header
      class="w-100 h-100 border-0 shadow-sm rounded-0"
      body-class="p-0"
    >
      <b-card-body
        class="p-0"
      >
        <div
          class="position-absolute pl-3 pt-2"
          style="z-index: 1;"
        >
          <div
            class="d-flex align-items-center h1 mb-0"
          >
            <b>{{ workflow.meta.name || workflow.handle }}</b>
            <a
              href="#"
              class="h4 mb-0 ml-2"
              v-b-modal.workflow
            >
              <font-awesome-icon
                :icon="['fas', 'cog']"
              />
            </a>

            <!-- <a
              href="#"
              class="h4 mb-0 ml-2"
              @click="saveWorkflow()"
            >
              <font-awesome-icon
                :icon="['fas', 'save']"
              />
            </a> -->
          </div>
          <p
            class="mb-0 text-truncate"
            style="white-space: pre-line; max-width: 738px; max-height: 50px;"
          >
            {{ workflow.meta.description }}
          </p>
        </div>

        <div
          class="d-flex flex-column flex-shrink position-absolute fixed-bottom m-2"
          style="z-index: 1; width: fit-content;"
        >
          <b-button
            v-if="changeDetected"
            variant="dark"
            class="rounded-0 py-2 px-3"
            @click="saveWorkflow()"
          >
            Changes detected. Click here to save.
          </b-button>
          <b-button
            v-if="(workflow.issues || []).length"
            variant="danger"
            class="rounded-0 py-2 px-3"
            :class="{ 'mt-3': changeDetected }"
            v-b-modal.issues
          >
            Issues detected. Click here to view.
          </b-button>
        </div>

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
      width="500px"
      header-class="bg-white border-bottom border-light p-2"
      body-class="bg-white"
      footer-class="bg-white border-top border-light p-1"
    >
      <template
        #header
      >
        <div
          v-if="sidebar.item"
          class="d-flex align-items-center w-100 h5 mb-0 p-2"
        >
          <b-img
            :src="getSidebarItemIcon"
          />
          <h4
            class="text-primary font-weight-bold ml-2 mb-0"
          >
            <b>{{ getSidebarItemType }}</b>
          </h4>

          <div
            class="ml-auto"
          >
            ID: <var>{{ getSelectedItem.node.id }}</var>
          </div>
        </div>
      </template>

      <configurator
        v-if="sidebar.item"
        :item.sync="sidebar.item"
        :edges.sync="edges"
        @update-value="setValue($event)"
      />

      <template
        #footer
      >
        <div
          class="d-flex m-2"
        >
          <c-input-confirm
            size="md"
            variant="danger"
            :borderless="false"
            @confirmed="sidebarDelete()"
          >
            Delete
          </c-input-confirm>
        </div>
      </template>
    </b-sidebar>


    <b-modal
      id="workflow"
      title="Workflow configuration"
      size="lg"
      hide-footer
    >
      <workflow-configurator
        v-if="workflow.workflowID"
        :workflow="workflow"
        @delete="$emit('delete')"
      />
    </b-modal>

    <b-modal
      id="help"
      title="Help"
      size="lg"
      scrollable
      hide-footer
      body-class="p-0"
    >
      <help />
    </b-modal>

    <b-modal
      id="issues"
      title="Workflow issues"
      hide-footer
    >
      <div
        v-for="(issue, index) in workflow.issues"
        :key="index"
      >
        <!-- <b
          v-if="workflow.steps[issue.culprit.step].stepID"
        >
          StepID:
        </b> <var>{{ workflow.steps[issue.culprit.step].stepID }}</var> -->
        Position: {{ issue.culprit.step }}
        <p>
          <code>{{ issue.description[0].toUpperCase() + issue.description.slice(1).toLowerCase() }}</code>
        </p>
      </div>
    </b-modal>
  </div>
</template>

<script>
import mxgraph from "mxgraph"
import Vue from 'vue'
import { encodeGraph } from "../lib/codec"
import { getStyleFromKind, getKindFromStyle } from "../lib/style"
import toolbarConfig from "../lib/toolbar.js"
import Configurator from '../components/Configurator'
import Tooltip from '../components/Tooltip.vue'
import WorkflowConfigurator from '../components/Configurator/Workflow'
import Help from '../components/Help'

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
  mxCellMarker,
  mxRectangle,
  mxLog,
  mxImage,
  mxConstraintHandler,
  mxConnectionConstraint,
  mxCellState,
  mxRectangleShape,
  mxEllipse,
} = mxgraph()

const originPoint = -2042

export default {
  name: 'WorkflowEditor',

  components: {
    Configurator,
    WorkflowConfigurator,
    Tooltip,
    Help
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

    changeDetected: {
      type: Boolean,
      default: false,
    }
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
      cellMarker: undefined,

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
    getLogo () {
      return `${process.env.BASE_URL}favicon.ico`
    },

    getSidebarItemType () {
      const { itemType } = this.sidebar
      if (itemType) {
        return itemType.charAt(0).toUpperCase() + itemType.slice(1)
      }
      return itemType
    },

    getSidebarItemIcon () {
      const { item } = this.sidebar

      if (item && item.config) {
        return getStyleFromKind(item.config).icon
      }
    },

    getSelectedItem () {
      return this.sidebar.item ? this.sidebar.item : undefined
    },
  },

  watch: {
    workflow: {
      handler (workflow) {
        if (!workflow.workflowID) return

        // If worklow exist render it
        this.render(workflow)
      }
    },
  },

  mounted () {
    try {
      if (!mxClient.isBrowserSupported()) {
        throw new Error(mxUtils.error('Browser is not supported!', 200, false))
      }

      mxEvent.disableContextMenu(this.$refs.graph)
      this.graph = new mxGraph(this.$refs.graph, null, mxConstants.DIALECT_STRICTHTML)
      this.eventHandler = new mxGraphHandler(this.graph)
      this.keyHandler = new mxKeyHandler(this.graph)
      new mxRubberband(this.graph) // Enables multiple selection

      this.setup()

      this.initToolbar()
      this.initCellMarker()
      this.initUndoManager()

      this.keys()
      this.events()

      this.styling()
      this.connectionHandler()


      this.render(this.workflow)
    } catch (e) {
      console.error(e)
    }
  },

  methods: {
    deleteSelectedCells () {
      this.sidebarClose()
      this.graph.removeCells()
    },

    sidebarClose () {
      this.sidebar.show = false
      setTimeout(() => {
        this.sidebar.item = undefined
        this.sidebar.itemType = undefined
      }, 300)
    },

    sidebarDelete () {
      if (this.getSelectedItem) {
        this.graph.removeCells([this.getSelectedItem.node])
        this.sidebarClose()
      }
    },

    sidebarReopen (item, itemType) {
      // If not open, just open sidebar
      if (!this.sidebar.show) {
        this.sidebar.item = item
        this.sidebar.itemType = itemType
        this.sidebar.show = true
      } else {
        // If item already opened in sidebar, keep open
        if (this.sidebar.item && item.node.id === this.sidebar.item.node.id) {
          return
        }

        // Otherwise reopen completely
        this.sidebar.show = false
        if (!this.sidebar.show) {
          setTimeout(() => {
          this.sidebar.item = item
          this.sidebar.itemType = itemType
            this.sidebar.show = !this.sidebar.show
          }, 300)
        }
      }
    },

    setup() {
      this.graph.zoomFactor = 1.1

      // Sets a background image and restricts child movement to its bounds
      this.graph.setBackgroundImage(new mxImage(`${process.env.BASE_URL}icons/grid.svg`, 8192, 8192))
      this.graph.maximumGraphBounds = new mxRectangle(0, 0, 8192, 8192)
      this.graph.gridSize = 8

      this.graph.setPanning(true)
      this.graph.setConnectable(true)
      this.graph.setAllowDanglingEdges(false)
      this.graph.edgeLabelsMovable = false

      // Enables guides
      mxGraphHandler.prototype.guidesEnabled = true
      
      // Alt disables guides
      mxGraphHandler.prototype.useGuidesForEvent = (evt) => {
        return mxEvent.isAltDown(evt.getEvent())
      }

      mxEdgeHandler.prototype.snapToTerminals = true

      this.graph.isHtmlLabel  = cell => {
        return true
      }

      this.graph.isWrapping = cell => {
        return true
      }

      this.graph.getLabel = cell => {
        let label = mxGraph.prototype.getLabel.apply(this, arguments)

        if (cell.edge) {
          if (cell.value) {
            label = `<div class="text-nowrap py-1 px-3 h6 mb-0 rounded bg-white" style="border: 2px solid #A7D0E3; border-radius: 5px; color: #2D2D2D;">${cell.value}</div>`;
          }
        } else {
          const vertex = this.vertices[cell.id]
          if (vertex.config.kind !== 'visual') {
            const icon = getStyleFromKind(vertex.config).icon
            const cog = `${process.env.BASE_URL}icons/cog.svg`
            const type = vertex.config.kind.charAt(0).toUpperCase() + vertex.config.kind.slice(1)
            const shadow = 'shadow'// ((this.getSelectedItem || {}).node || {}).id === cell.id ? 'shadow-lg' : 'shadow'
  
            label = `<div class="d-flex flex-column bg-white rounded ${shadow} step" style="width: 200px; height: 80px;  border-radius: 5px;">`+ 
                      `<div class="d-flex flex-row align-items-center text-primary px-2 my-1 h6 mb-0 font-weight-bold" style="height: 35px;">`+
                        `<img src="${icon}" class="mr-2"/>${type}`+
                        `<a href="#" class="hide ml-auto" style="text-decoration: none;">`+
                          `<img id="openSidebar" src="${cog}" style="width: 16px;"/>`+
                        `</a>`+
                      `</div>`+
                      `<div class="d-flex flex-row align-items-center border-top text-truncate px-2 mb-0 h6" style="height: 45px; color: #2D2D2D;">`+
                        `<span class="d-inline-block text-truncate">${cell.value || '/'}</span>`+
                      `</div>`+
                    `</div>`;
          } else {
            label = `<div class="d-flex"><span class="d-inline-block h6 mb-0 text-truncate">${cell.value || ''}</span></div>`
          }
        }

        return label
      }

      this.graph.isCellEditable = () => {
        return false
      }

      // this.edgeLayout = new mxParallelEdgeLayout(this.graph)
      // this.edgeLayout.isEdgeIgnored = (edge) => {
      //   return (edge.geometry.points || []).length
      // }

      // Disables mxGraph console window
      mxLog.setVisible = () => {}

      mxGraph.prototype.expandedImage = undefined

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

      const addCell = ({ title, icon, tooltip = '', width = 60, height = 60, style }) => {
        const cell = new mxCell(
          null,
          new mxGeometry(0, 0, width, height),
          style
        )
        cell.setVertex(true)

        this.addToolbarItem(title, this.graph, this.toolbar, cell, icon, tooltip)
      }

      toolbarConfig.forEach(cell => {
        if (cell.kind === 'hr') {
          this.toolbar.addLine()
        } else if (cell.kind === 'nl') {
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

    initCellMarker () {
      this.cellMarker = new mxCellMarker(this.graph, 'none', 'none', 0.5)

      this.graph.addMouseListener({
        mouseDown: (a, b) => {},
        mouseMove: (sender, me) => {
          this.cellMarker.process(me)
        },
        mouseUp: () => {}
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
        mxClipboard.cut(this.graph, this.graph.getSelectionCells())
      }

      // Ctrl + C
      this.keyHandler.controlKeys[67] = () => {
        mxClipboard.copy(this.graph, this.graph.getSelectionCells())
      }

      // Ctrl + V
      this.keyHandler.controlKeys[86] = () => {
        mxClipboard.paste(this.graph)
      }

      // Ctrl + A
      this.keyHandler.controlKeys[65] = () => {
        this.graph.selectAll()
      }

      // Ctrl + S
      this.keyHandler.controlKeys[83] = () => {
        this.saveWorkflow()
      }

      // Ctrl + Z
      this.keyHandler.controlKeys[90] = () => {
        this.undoManager.undo()
      }

      // Ctrl + Shift + Z
      this.keyHandler.controlShiftKeys[90] = () => {
        this.undoManager.redo()
      }

      // Backspace
      this.keyHandler.normalKeys[8] = () => {
        this.deleteSelectedCells()
      }

      // Delete
      this.keyHandler.normalKeys[46] = () => {
        this.deleteSelectedCells()
      }

      // Ctrl + Space, Resets view to original state (zoom = 1, x = 0, y = 0)
      this.keyHandler.controlKeys[32] = () => {
        this.graph.zoomTo(1)
        this.graph.view.setTranslate(originPoint, originPoint)
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

        if (target.config.kind === 'gateway') {
          if (['join', 'fork'].includes(target.config.ref)) {
            this.updateVertexConfig(target.node.id)
          }
        }

        if (source.config.kind === 'gateway') {
          if (['join', 'fork'].includes(source.config.ref)) {
            this.updateVertexConfig(source.node.id)
          }

          if (source.config.ref === 'excl') {
            this.edges[node.id].node.value = `#${outPaths.length} - ${outPaths.length === 1 ? 'If' : 'Else (if)'}`
          } else if (source.config.ref === 'incl') {
            this.edges[node.id].node.value = `#${outPaths.length} - If`
          }
        } else if (source.config.kind === 'error-handler') {
          this.edges[node.id].node.value = `#${outPaths.length} - ${outPaths.length === 1 ? 'Catch' : 'Try'}`
        } else if (source.config.kind === 'iterator') {
          this.edges[node.id].node.value = `#${outPaths.length} - ${outPaths.length === 1 ? 'Loop body' : 'Loop end'}`
        }

        // this.edgeLayout.execute(this.graph.getDefaultParent())
        this.edgeConnected = true
      })


      this.graph.addListener(mxEvent.CELLS_ADDED, (sender, evt) => {
        const [cell] = evt.getProperty('cells')
        if (cell && cell.vertex) {
          if (!this.rendering) {
            this.addCellToVertices(cell)
            this.graph.setSelectionCells([cell])
            // this.sidebar.show = true
            // this.sidebarReopen(this.vertices[cell.id], this.vertices[cell.id].config.kind)
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
            if (cell != null && (((this.vertices[cell.id] || {}).config || {}).kind === 'visual' || cell.edge || event.target.id === 'openSidebar')) {
              const item = cell.edge ? this.edges[cell.id] : this.vertices[cell.id]
              const itemType = cell.edge ? 'edge' : item.config.kind
              this.sidebarReopen(item, itemType)
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

      // Zoom event
      mxEvent.addMouseWheelListener((event, up) => {
        if (mxEvent.isConsumed(event)) {
          return
        }

        if (mxEvent.isControlDown(event) || (mxClient.IS_MAC && mxEvent.isMetaDown(event))) {
          return
        }

        if (up && this.graph.view.scale < 3) {
          this.graph.zoomIn()
        } else if (!up && this.graph.view.scale > 0.1) {
          this.graph.zoomOut()
        }


        mxEvent.consume(event)
      }, this.graph.container)

      this.graph.model.addListener(mxEvent.CHANGE, (sender, evt) => {
        if (!this.rendering) {
          this.$root.$emit('change-detected')
        }
      })
    },

    styling() {
      // General
      mxConstants.VERTEX_SELECTION_COLOR = '#A7D0E3'
      mxConstants.VERTEX_SELECTION_STROKEWIDTH = 2
      mxConstants.EDGE_SELECTION_COLOR = '#A7D0E3'
      mxConstants.EDGE_SELECTION_STROKEWIDTH = 2

      mxConstants.HANDLE_FILLCOLOR = '#4D7281'
      mxConstants.HANDLE_STROKECOLOR = 'none'
      mxConstants.CONNECT_HANDLE_FILLCOLOR = '#4D7281'
      mxConstants.VALID_COLOR = '#A7D0E3'

      mxConstants.GUIDE_COLOR = '#2D2D2D'
      mxConstants.GUIDE_STROKEWIDTH = 1

      // Creates the default style for vertices
      let style = this.graph.getStylesheet().getDefaultVertexStyle()
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter
      style[mxConstants.STYLE_STROKECOLOR] = 'none'
      style[mxConstants.STYLE_STROKEWIDTH] = 0
      style[mxConstants.STYLE_ROUNDED] = true
      style[mxConstants.STYLE_ARCSIZE] = 5
      style[mxConstants.STYLE_RESIZABLE] = false
      style[mxConstants.STYLE_FILLCOLOR] = 'none'
      style[mxConstants.STYLE_FONTCOLOR] = '#2D2D2D'
      style[mxConstants.STYLE_FONTSIZE] = 13
      this.graph.getStylesheet().putDefaultVertexStyle(style)

      // Creates the default style for edges
      style = this.graph.getStylesheet().getDefaultEdgeStyle()
      style[mxConstants.STYLE_STROKECOLOR] = '#A7D0E3'
      style[mxConstants.STYLE_EDGE] = mxEdgeStyle.OrthConnector
      style[mxConstants.STYLE_ROUNDED] = true
      style[mxConstants.STYLE_ORTHOGONAL] = true
      style[mxConstants.STYLE_MOVABLE] = false
      style[mxConstants.STYLE_FONTCOLOR] = '#2D2D2D'
      style[mxConstants.STYLE_STROKEWIDTH] = 2
      style[mxConstants.STYLE_ENDSIZE] = 15
      style[mxConstants.STYLE_STARTSIZE] = 15
      style[mxConstants.STYLE_SOURCE_JETTY_SIZE] = 30
      style[mxConstants.STYLE_TARGET_JETTY_SIZE] = 30
      this.graph.getStylesheet().putDefaultEdgeStyle(style)

      // Swimlane
      style = {}
      style[mxConstants.STYLE_ROUNDED] = true
      style[mxConstants.STYLE_ARCSIZE] = 5
      style[mxConstants.STYLE_RESIZABLE] = true
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_SWIMLANE
      style[mxConstants.STYLE_FONTSIZE] = 15
      style[mxConstants.STYLE_HORIZONTAL] = false
      style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_MIDDLE
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE
      style[mxConstants.STYLE_FILLCOLOR] = 'white'
      style[mxConstants.STYLE_STROKECOLOR] = '#2D2D2D'
      style[mxConstants.STYLE_STROKEWIDTH] = 0
      style[mxConstants.STYLE_STROKEWIDTH] = 2
      this.graph.getStylesheet().putCellStyle('swimlane', style)

      // // Symbol (custom shape) styling
      // style = mxUtils.clone(this.graph.getStylesheet().getDefaultVertexStyle())
      // style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE
      // style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter
      // style[mxConstants.STYLE_FONTSIZE] = 13
      // style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER
      // style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP
      // style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_BOTTOM
      // this.graph.getStylesheet().putCellStyle('symbol', style)

      // // Function
      // style = mxUtils.clone(this.graph.getStylesheet().getCellStyle('symbol'))
      // style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER
      // style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE
      // style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_MIDDLE
      // this.graph.getStylesheet().putCellStyle('function', style)

      // // Iterator
      // // style = mxUtils.clone(this.graph.getStylesheet().getCellStyle('symbol'))
      // // this.graph.getStylesheet().putCellStyle('iterator', style)

      // // Event
      // style = mxUtils.clone(this.graph.getStylesheet().getCellStyle('symbol'))
      // style[mxConstants.STYLE_PERIMETER] = mxPerimeter.EllipsePerimeter
      // style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER
      // style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_CENTER
      // style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_MIDDLE
      // this.graph.getStylesheet().putCellStyle('event', style)

      // // Error handler
      // style = mxUtils.clone(this.graph.getStylesheet().getCellStyle('event'))
      // this.graph.getStylesheet().putCellStyle('error-handler', style)

      // // Gateway
      // style = mxUtils.clone(this.graph.getStylesheet().getCellStyle('symbol'))
      // style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RhombusPerimeter
      // style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_TOP
      // style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_BOTTOM
      // this.graph.getStylesheet().putCellStyle('gateway', style)

      // // Expression
      // style = mxUtils.clone(this.graph.getStylesheet().getCellStyle('symbol'))
      // this.graph.getStylesheet().putCellStyle('expressions', style)

    },

    connectionHandler() {
      mxConstraintHandler.prototype.intersects = function(icon, point, source, existingEdge) {
        return (!source || existingEdge) || mxUtils.intersects(icon.bounds, point)
      }

      // const mxConnectionHandlerUpdateEdgeState = mxConnectionHandler.prototype.updateEdgeState
      // mxConnectionHandler.prototype.updateEdgeState = function(pt, constraint) {
      //   if (pt != null && this.previous != null) {
      //     const constraints = this.graph.getAllConnectionConstraints(this.previous)
      //     let nearestConstraint = null
      //     let dist = null

      //     for (let i = 0; i < constraints.length; i++) {
      //       const cp = this.graph.getConnectionPoint(this.previous, constraints[i])

      //       if (cp != null) {
      //         const tmp = (cp.x - pt.x) * (cp.x - pt.x) + (cp.y - pt.y) * (cp.y - pt.y)

      //         if (dist == null || tmp < dist) {
      //           nearestConstraint = constraints[i]
      //           dist = tmp
      //         }
      //       }
      //     }
          
      //     if (nearestConstraint != null) {
      //       this.sourceConstraint = nearestConstraint
      //     }
          
      //     // In case the edge style must be changed during the preview:
      //     // this.edgeState.style['edgeStyle'] = 'orthogonalEdgeStyle';
      //     // And to use the new edge style in the new edge inserted into the graph,
      //     // update the cell style as follows:
      //     // this.edgeState.cell.style = mxUtils.setStyle(this.edgeState.cell.style, 'edgeStyle', this.edgeState.style['edgeStyle']);
      //   }
      
      //   mxConnectionHandlerUpdateEdgeState.apply(this, arguments)
      // }

      if (this.graph.connectionHandler.connectImage === null) {
        this.graph.connectionHandler.isConnectableCell = function(cell) {
          return false
        }
        mxEdgeHandler.prototype.isConnectableCell = function(cell) {
          return this.graph.connectionHandler.isConnectableCell(cell)
        }
      }

      this.graph.getAllConnectionConstraints = function(terminal) {
        if (terminal != null && this.model.isVertex(terminal.cell) && !terminal.cell.style.includes('swimlane')) {
          return [
            new mxConnectionConstraint(new mxPoint(0, 0), true),
            new mxConnectionConstraint(new mxPoint(0.25, 0), true),
            new mxConnectionConstraint(new mxPoint(0.5, 0), true),
            new mxConnectionConstraint(new mxPoint(0.75, 0), true),
            new mxConnectionConstraint(new mxPoint(1, 0), true),
            new mxConnectionConstraint(new mxPoint(1, 0.25), true),
            new mxConnectionConstraint(new mxPoint(1, 0.5), true),
            new mxConnectionConstraint(new mxPoint(1, 0.75), true),
            new mxConnectionConstraint(new mxPoint(1, 1), true),
            new mxConnectionConstraint(new mxPoint(0.75, 1), true),
            new mxConnectionConstraint(new mxPoint(0.5, 1), true),
            new mxConnectionConstraint(new mxPoint(0.25, 1), true),
            new mxConnectionConstraint(new mxPoint(0, 1), true),
            new mxConnectionConstraint(new mxPoint(0, 0.75), true),
            new mxConnectionConstraint(new mxPoint(0, 0.5), true),
            new mxConnectionConstraint(new mxPoint(0, 0.25), true),
          ]
        }

        return null
      }

      // mxConnectionHandler.prototype.waypointsEnabled = true

      mxConstraintHandler.prototype.pointImage = new mxImage(`${process.env.BASE_URL}icons/connectionPoint.svg`, 8, 8)

      mxConstraintHandler.prototype.createHighlightShape = function() {
        var hl = new mxEllipse(null, '#A7D0E3', '#A7D0E3', 1)

        return hl
      }


      // Connect preview - bugged
      mxConnectionHandler.prototype.createEdgeState = function(me) {
        const edge = this.graph.createEdge(null, null, null, null, null)
        console.log(this.graph.getCellStyle(edge))
        return new mxCellState(this.graph.view, edge, this.graph.getStylesheet().getDefaultEdgeStyle())
      }
    },

    initUndoManager () {
      this.undoManager = new mxUndoManager()
      // Register UNDO and REDO
      const listener = (sender, evt) => {
        this.undoManager.undoableEditHappened(evt.getProperty('edit'))
      }

      this.graph.getModel().addListener(mxEvent.UNDO, listener)
      this.graph.getView().addListener(mxEvent.UNDO, listener)

      this.graph.getModel().addListener(mxEvent.REDO, listener)
      this.graph.getView().addListener(mxEvent.REDO, listener)
    },

    addToolbarItem(title, graph, toolbar, prototype, icon, tooltip) {
      const funct = (graph, evt, cell) => {
        graph.stopEditing(false)

        const pt = graph.getPointForEvent(evt)
        let vertex = graph.getModel().cloneCell(prototype)
        vertex.geometry.x = pt.x
        vertex.geometry.y = pt.y

        const [newCell] = graph.importCells([vertex], 0, 0, cell)
       }

      const dragElt = document.createElement('div')
      dragElt.style.border = 'dashed #A7D0E3 2px'
      dragElt.style.width = `${prototype.geometry.width}px`
      dragElt.style.height = `${prototype.geometry.height}px`

      const img = toolbar.addMode(title, icon, funct)

      const ds = mxUtils.makeDraggable(img, graph, funct, dragElt, null, null, this.graph.autoscroll, true)

      // Init step tooltip
      img.id = prototype.style.split(';')[0]
      const TooltipComponent = Vue.extend(Tooltip)
      const instance = new TooltipComponent({
        propsData: { title, kind: img.id, img: icon, text: tooltip }
      })
      instance.$mount()
      this.$refs.tooltips.appendChild(instance.$el)

      // When dragged over toolbar it shows as img otherwise show border
      ds.createDragElement = mxDragSource.prototype.createDragElement
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

    setValue (value) {
      this.graph.model.setValue(this.sidebar.item.node, value)
    },

    render (workflow) {
      this.rendering = true

      const { x = originPoint, y = originPoint } = this.graph.view.translate
      const { scale } = this.graph.view


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

      this.graph.getModel().clear()

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
            edge.source = config.parentID || edge.source
            edge.target = config.childID || edge.target

            const newEdge = this.graph.insertEdge(edge.parent, edge.id, edge.value, this.vertices[edge.source].node, this.vertices[edge.target].node, edge.style)
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
        this.graph.view.scale = scale
        this.graph.view.setTranslate(x || originPoint, y || originPoint)

        this.graph.getModel().endUpdate() // Updates the display

        this.rendering = false
      }
    },

    getJsonModel () {
      return encodeGraph(this.graph.getModel(), this.vertices, this.edges)
    },

    saveWorkflow () {
      this.$emit('save', this.getJsonModel())
      this.sidebarClose()
    }
  },
}
</script>

<style scoped lang="scss">
#graph {
  outline: none;
}
</style>

<style>
.hide {
  display: none;
}
.step:hover .hide {
  display: block;
}
#toolbar > hr {
  margin: 0.5rem 0 0.5rem 0 !important;
  align-self: stretch;
}
</style>
