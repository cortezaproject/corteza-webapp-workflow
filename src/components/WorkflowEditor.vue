<template>
  <div
    id="editor"
    class="h-100 d-flex"
  >
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
          class="d-flex flex-column align-items-center mt-1 overflow-auto"
        />

        <div
          class="d-flex flex-grow-1 align-items-end justify-content-center p-3"
        >
          <b-button
            variant="link"
            class="p-0"
            v-b-modal.help
          >
            <font-awesome-icon
              :icon="['far', 'question-circle']"
              class="h4 mb-0"
            />
          </b-button>
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
          class="position-absolute pl-3 pt-2 w-100 mw-100"
          style="z-index: 1;"
        >
          <div
            class="d-flex align-items-center"
            :class="{ 'mb-2': workflow.meta.description }"
          >
            <b-button
              variant="link"
              class="p-0 mr-3"
              v-b-modal.workflow
            >
              <font-awesome-icon
                :icon="['fas', 'cog']"
                class="h4 mb-0"
              />
            </b-button>
            <h1
              class="mb-0 text-truncate"
            >
              <b>{{ workflow.meta.name || workflow.handle }}</b>
            </h1>
          </div>

          <p
            v-if="workflow.meta.description"
            class="mb-0 text-truncate"
            style="white-space: pre-line; max-width: 50%; max-height: 48px;"
            :class="{ 'mb-2': getRunAs }"
          >
            {{ workflow.meta.description }}
          </p>
          <p
            v-if="getRunAs"
            class="mb-0 text-truncate"
          >
            <b>Run as:</b> <samp>{{ getRunAs }}</samp>
          </p>

          <div
            class="d-flex align-items-center mb-1"
          >
            <h5
              v-if="!workflow.enabled"
              class="mb-0 mr-1"
            >
              <b-badge
                variant="danger"
              >
                Disabled
              </b-badge>
            </h5>

            <h5
              v-if="hasIssues"
              class="mb-0"
            >
              <b-badge
                variant="danger"
              >
                Issues detected
              </b-badge>
            </h5>
          </div>
        </div>

        <div
          class="bg-white position-absolute m-2 zoom border border-secondary"
          style="z-index: 1; width: fit-content;"
        >
          <div
            class="d-flex align-items-baseline p-2"
          >
            {{ getZoomPercent }}
            <b-button
              variant="link"
              class="ml-4 p-0"
              @click="zoom(false)"
            >
              <font-awesome-icon
                :icon="['fas', 'search-minus']"
              />
            </b-button>
            <b-button
              variant="link"
              class="ml-1 p-0"
              @click="zoom()"
            >
              <font-awesome-icon
                :icon="['fas', 'search-plus']"
                class="pointer"
                @click="zoom()"
              />
            </b-button>
            <b-button
              variant="link"
              class="ml-2 p-0 text-decoration-none"
              @click="resetZoom()"
            >
              Reset
            </b-button>
          </div>
        </div>

        <div
          class="d-flex flex-column flex-shrink position-absolute fixed-bottom m-2"
          style="z-index: 1; width: fit-content;"
        >
          <b-button
            v-if="changeDetected"
            variant="dark"
            class="rounded-0 py-2 px-3"
            :disabled="!workflow.canUpdateWorkflow"
            @click="saveWorkflow()"
          >
            Changes detected {{ `${workflow.canUpdateWorkflow ? 'Click here to save.' : ''}` }}
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
        :out-edges="sidebar.outEdges"
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
            sizeConfirm="md"
            variant="danger"
            :borderless="false"
            @confirmed="sidebarDelete()"
          >
            Delete
          </c-input-confirm>

          <b-button
            v-if="canTest"
            variant="success"
            class="ml-auto"
            @click="setTestInput()"
          >
            Test workflow
          </b-button>
        </div>
      </template>
    </b-sidebar>


    <b-modal
      id="workflow"
      title="Workflow configuration"
      size="lg"
      hide-footer
    >
      <template #modal-title>
        Workflow Configuration

        <c-permissions-button
          v-if="workflow.canGrant"
          :title="workflow.meta.name || workflow.handle"
          :target="workflow.meta.name || workflow.handle"
          :resource="`automation:workflow:${workflow.workflowID}`"
          link
          class="ml-2"
        />
      </template>
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
      v-model="issuesModal.show"
      title="Step issues"
      hide-footer
    >
      <div
        v-for="(issue, index) in issuesModal.issues"
        :key="index"
      >
        <p>
          <code>{{ issue[0].toUpperCase() + issue.slice(1).toLowerCase() }}</code>
        </p>
      </div>
    </b-modal>

    <!-- <b-modal
      v-model="dryRun.show"
      id="dry-run"
      title="Initial scope"
      ok-only
      ok-title="Run"
      ok-variant="success"
      @ok="testWorkflow"
    >
      <b-form-group
        v-for="(property, index) in dryRun.initialScope"
        :key="index"
        :label="property.label"
      >
        <b-form-input
          v-model="property.value"
        />
      </b-form-group>
    </b-modal> -->
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
  mxRectangle,
  mxLog,
  mxImage,
  mxConstraintHandler,
  mxConnectionConstraint,
  mxCellState,
  mxRectangleShape,
  mxEllipse,
  mxCellOverlay,
  mxCellHighlight,
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
      issues: {},

      runAsUser: undefined,

      toolbar: undefined,

      edgeConnected: false,
      // edgeLayout: undefined,

      rendering: false,

      sidebar: {
        item: undefined,
        itemType: undefined,
        outEdges: 0,
        show: false,
      },

      issuesModal: {
        show: false,
        issues: [],
      },

      dryRun: {
        constraints: [],
        show: false,
      },

      zoomLevel: 1,
    }
  },

  computed: {
    getLogo () {
      return `${process.env.BASE_URL}favicon.ico`
    },

    getSidebarItemType () {
      const { itemType } = this.sidebar
      if (itemType) {
        if (itemType === 'edge') {
          return 'Connector'
        }
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

    getZoomPercent () {
      return `${Math.floor(this.zoomLevel * 100).toFixed(0)}%`
    },

    canTest () {
      if (this.sidebar.item && this.workflow.canExecuteWorkflow) {
        return this.sidebar.item.triggers && this.sidebar.item.triggers.triggerID && this.sidebar.item.triggers.eventType === 'onManual'
      }
      return false
    },

    hasIssues () {
      return (this.workflow.issues || []).length
    },

    getRunAs () {
      if (this.runAsUser) {
        const { userID, name, username, email } = this.runAsUser
        return name || username || email || `<@${userID}>`
      }
      return undefined
    }
  },

  watch: {
    workflow: {
      handler (workflow) {
        if (!workflow.workflowID) return

        // If worklow exist render it
        this.render(workflow)
      }
    },

    'workflow.runAs': {
      immediate: true,
      handler (runAs = '0') {
        if (runAs !== '0') {
          this.$SystemAPI.userRead({ userID: runAs })
            .then(user => {
              this.runAsUser = user
            })
        } else {
          this.runAsUser = undefined
        }
      }
    }
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
      this.initUndoManager()
      this.initClipboard()

      this.keys()
      this.events()
      this.cellOverlay()

      this.styling()
      this.connectionHandler()

      this.$root.$on('trigger-updated', ({ mxObjectId }) => {
        this.redrawLabel(mxObjectId)
      })

      this.render(this.workflow, true)

    } catch (e) {
      console.error(e)
    }
  },

  methods: {
    deleteSelectedCells () {
      if (this.sidebar.item && this.graph.getSelectionModel().isSelected(this.sidebar.item.node)) {
        this.sidebarClose()
      }
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
        this.sidebar.outEdges = (item.node.edges || []).length
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
        this.sidebar.outEdges = (item.node.edges || []).length
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
      this.graph.zoomFactor = 1.2

      // Sets a background image and restricts child movement to its bounds
      this.graph.setBackgroundImage(new mxImage(`${process.env.BASE_URL}icons/grid.svg`, 8192, 8192))
      this.graph.maximumGraphBounds = new mxRectangle(0, 0, 8192, 8192)
      this.graph.gridSize = 8

      this.graph.setPanning(true)
      this.graph.setConnectable(true)
      this.graph.setAllowDanglingEdges(false)
      this.graph.setTooltips(true)
      this.graph.edgeLabelsMovable = false

      // Enables guides
      mxGraphHandler.prototype.guidesEnabled = true
      
      // Alt disables guides
      mxGraphHandler.prototype.useGuidesForEvent = (evt) => {
        return mxEvent.isAltDown(evt.getEvent())
      }

      const mxGraphHandlerIsValidDropTarget = mxGraphHandler.prototype.isValidDropTarget
      mxGraphHandler.prototype.isValidDropTarget = function(target, me) {
        return mxGraphHandlerIsValidDropTarget.apply(this, arguments) && !target.edge
      }

      mxEdgeHandler.prototype.snapToTerminals = true

      mxGraph.prototype.minFitScale = 1
      mxGraph.prototype.maxFitScale = 1

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
            label = `<div id="openSidebar" class="text-nowrap py-1 px-3 h6 mb-0 rounded bg-white pointer" style="border: 2px solid #A7D0E3; border-radius: 5px; color: #2D2D2D;">${cell.value}</div>`
          }
        } else if (this.vertices[cell.id]) {
          const vertex = this.vertices[cell.id]
          if (vertex && vertex.config.kind !== 'visual') {
            const icon = getStyleFromKind(vertex.config).icon
            const type = vertex.config.kind.charAt(0).toUpperCase() + vertex.config.kind.slice(1)
            const shadow = 'shadow'// ((this.getSelectedItem || {}).node || {}).id === cell.id ? 'shadow-lg' : 'shadow'
            const cog = `${process.env.BASE_URL}icons/cog.svg`
            const issue = `${process.env.BASE_URL}icons/issue.svg`
            const opacity = vertex.config.kind === 'trigger' && !vertex.triggers.enabled ? 'opacity: 0.7;' : ''

            let issues = ''
            let id = ''
            if (this.issues[cell.id]) {
              issues = `<img id="openIssues" src="${issue}" class="ml-2 pointer" style="width: 20px;"/>`
            } else {
              id = `<span class="show id-label">${cell.id}</span>`
            }

            label = `<div class="d-flex flex-column position-relative bg-white rounded step ${shadow}" style="width: 200px; height: 80px; border-radius: 5px;${opacity}">`+ 
                      `<div class="d-flex flex-row align-items-center text-primary px-2 my-1 h6 mb-0 font-weight-bold" style="height: 35px;">`+
                        `<img src="${icon}" class="mr-2"/>${type}`+
                        `<div class="d-flex h-100 ml-auto align-items-center">`+
                          `<img id="openSidebar" src="${cog}" class="hide pointer" style="width: 20px;"/>`+
                          id +
                          issues +
                        `</div>`+
                      `</div>`+
                      `<div class="d-flex flex-row align-items-center hover-untruncate border-top px-2 mb-0 h6" style="height: 45px; color: #2D2D2D;">`+
                        `<span class="d-inline-block bg-white hover-untruncate py-2 pr-2">${cell.value || '/'}</span>`+
                      `</div>`+
                    `</div>`;
          } else {
            label = `<div id="openSidebar" class="d-flex"><span class="d-inline-block h6 mb-0 text-truncate">${cell.value || ''}</span></div>`
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

    initUndoManager () {
      this.undoManager = new mxUndoManager()
      // Register UNDO and REDO
      const listener = (sender, evt) => {
        if (!this.rendering) {
          this.undoManager.undoableEditHappened(evt.getProperty('edit'))
        }
      }

      this.graph.getModel().addListener(mxEvent.UNDO, listener)
      this.graph.getView().addListener(mxEvent.UNDO, listener)

      this.graph.getModel().addListener(mxEvent.REDO, listener)
      this.graph.getView().addListener(mxEvent.REDO, listener)
    },

    makeCellCopy ({ edge, id }) {
      let cell = edge ? this.edges[id] : this.vertices[id]
      let node = cell.node

      if (cell.node.children) {
        node = this.graph.model.cloneCell(cell.node, false)
        node.id = cell.node.id
      }

      const cellCopy = {
        node
      }

      // Need to use JSON.parse to remove references
      if (cell.config) {
        cellCopy.config = JSON.parse(JSON.stringify(cell.config))
      }

      if (cell.triggers) {
        let triggers = {
          enabled: cell.triggers.enabled,
          constraints: cell.triggers.constraints,
          eventType: cell.triggers.eventType,
          resourceType: cell.triggers.resourceType
        }

        cellCopy.triggers = JSON.parse(JSON.stringify(triggers))
      }

      return cellCopy
    },

    initClipboard () {
      // TODO cutting swimlanes doesn't respect geometry
      // TODO Nested swimlanes copy doesn't work properly
      mxClipboard.copy = (graph, cells) => {
        let exportableCells = graph.getExportableCells(graph.model.getTopmostCells(cells || graph.getSelectionCells()))

        cells = {}
        exportableCells.forEach(cell => {
          if (!cells[cell.parent.id]) {
            cells[cell.parent.id] = []
          }

          cells[cell.parent.id].push(this.makeCellCopy(cell))

          if (cell.children) {
            if (!cells[cell.id]) {
              cells[cell.id] = []
            }
            cell.children.forEach(cc => {
              cells[cc.parent.id].push(this.makeCellCopy(cc))
            })
          }
        })

        mxClipboard.insertCount = 1
        mxClipboard.setCells(cells)

        return cells
      }

      mxClipboard.cut = (graph, cells) => {
        cells = mxClipboard.copy(graph, cells)
        let cutCells = []
        Object.entries(cells).forEach(([parentID, children]) => {
          cutCells = [...cutCells, ...children.map(({ node }) => {
            if (node.style.includes('swimlane')) {
              return this.graph.model.getCell(node.id)
            } else {
              return node
            }
          })]
        })

        mxClipboard.insertCount = 0
        mxClipboard.removeCells(graph, cutCells)

        return cells
      }

      mxClipboard.paste = (graph) => {
        let cells = []

        if (!mxClipboard.isEmpty()) {
          const delta = mxClipboard.insertCount * mxClipboard.STEPSIZE
          const defaultParent = graph.getDefaultParent()
          const newCellIDs = {}
          const allCells = []
          cells = mxClipboard.getCells()
          if (cells) {
            Object.entries(cells).forEach(([parentID, children]) => {
              let tmpParent = newCellIDs[parentID]
              tmpParent = graph.model.contains(tmpParent) ? tmpParent : defaultParent

              const configs = []
              let nodes = []

              children.forEach(({ node, ...rest }) => {
                nodes.push(node)
                configs.push(rest)
              })

              graph.importCells(graph.getImportableCells(nodes),  delta, delta, tmpParent).forEach((node, index) => {
                if (node) {
                  const rest = JSON.parse(JSON.stringify(configs[index]))
                  // Remap ID's and Create edges/vertices entry

                  if (node.edge) {
                    rest.config.parentID = node.source.id
                    rest.config.childID = node.target.id
                    this.edges[node.id] = { node, ...rest }
                  } else {
                    newCellIDs[rest.config.stepID] = node
                    rest.config.stepID = node.id
                    this.vertices[node.id] = { node, ...rest }
                  }
                  this.redrawLabel(node.mxObjectId)
                }

                allCells.push(node)
              })
            })
          }

          mxClipboard.insertCount++
          graph.setSelectionCells(allCells)
          cells = allCells
        }

        return cells
      }
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
        if (this.graph.model.getChildCount(this.graph.getDefaultParent())) {
          this.graph.fit()
          this.graph.view.setTranslate(this.graph.view.translate.x + 79, this.graph.view.translate.y + 220)
          this.zoomLevel = this.graph.view.scale
        } else {
          this.resetZoom()
          this.graph.view.setTranslate(originPoint, originPoint)
        }
      }


      // Nudge
      const nudge = (keyCode, evt) => {
        if (!this.graph.isSelectionEmpty()) {
          let dx = 0
          let dy = 0

          // If shift is not pressed move cell by whole grid block
          const delta = evt.shiftKey ? 8 : 40

          if (keyCode === 37) {
            dx = -delta
          } else if (keyCode === 38) {
            dy = -delta
          } else if (keyCode === 39) {
            dx = delta
          } else if (keyCode === 40) {
            dy = delta
          }

          this.graph.moveCells(this.graph.getSelectionCells(), dx, dy)
        }
      }

      // Move cells with arrow keys
      this.keyHandler.bindKey(37, (evt) => {
        nudge(37, evt)
      })

      this.keyHandler.bindKey(38, (evt) => {
        nudge(38, evt)
      })

      this.keyHandler.bindKey(39, (evt) => {
        nudge(39, evt)
      })

      this.keyHandler.bindKey(40, (evt) => {
        nudge(40, evt)
      })
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
            this.edges[node.id].node.value = `If`
          }

          this.sidebar.outEdges = (source.node.edges || []).length
        } else if (source.config.kind === 'error-handler') {
          this.edges[node.id].node.value = `${outPaths.length === 1 ? 'Try' : 'Catch'}`
        } else if (source.config.kind === 'iterator') {
          this.edges[node.id].node.value = `${outPaths.length === 1 ? 'Body' : 'End'}`
        }

        // this.edgeLayout.execute(this.graph.getDefaultParent())
        this.edgeConnected = true
      })


      this.graph.addListener(mxEvent.CELLS_ADDED, (sender, evt) => {
        if (!this.rendering) {
          const cells = evt.getProperty('cells')
          cells.forEach(cell => {
            if (cell && cell.vertex) {
              if (!this.rendering) {
                this.addCellToVertices(cell)
                this.graph.setSelectionCells([cell])
              }
            }
          })
        }
      })

      this.graph.addListener(mxEvent.CELLS_REMOVED, (sender, evt) => {
        const cells = evt.getProperty('cells') || []
        cells.forEach(cell => {
          if (cell.edge) {
            let source = this.vertices[cell.source.id]
            let target = this.vertices[cell.target.id]

            // If exlusive gateway, update edge indexes (#n)
            if (source.config.kind === 'gateway') {
              if (source.config.ref === 'excl') {
                source.node.edges.filter(e => e.source.id === source.node.id).forEach((edge, index) => {
                  const [edgeID, ...rest] = edge.value.split(' - ')

                  this.edges[edge.id].node.value = `#${index + 1} - ${rest.join(' - ')}`
                  this.redrawLabel(edge.mxObjectId)
                })
              }

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
        const cell = evt.getProperty('cell')

        if (event) {
          if (mxEvent.isControlDown(event) || (mxClient.IS_MAC && mxEvent.isMetaDown(event))) {
            // Prevent sidebar opening/closing when CTRL(CMD) is pressed while clicking
          } else if (cell) {
            // If clicked on cell that can be configured
            const isVisual = ((this.vertices[cell.id] || {}).config || {}).kind === 'visual'
            if (event.target.id === 'openSidebar' || isVisual) {
              const item = cell.edge ? this.edges[cell.id] : this.vertices[cell.id]
              const itemType = cell.edge ? 'edge' : item.config.kind
              this.sidebarReopen(item, itemType)
            } else if (event.target.id === 'openIssues') {
              this.issuesModal.issues = this.issues[cell.id]
              this.issuesModal.show = true
            }
          } else if (!event.defaultPrevented) {
            // If click is on background and is not multiple selection, deselect all selected cells
            this.graph.getSelectionModel().clear()
            this.sidebar.show = false
            if (this.getSelectedItem) {
              this.sidebarClose()
            }
          }
        }

        evt.consume()
      })

      this.graph.addListener(mxEvent.DOUBLE_CLICK, (sender, evt) => {
        const event = evt.getProperty('event')
        if (event) {
          const cell = evt.getProperty('cell')
          if (cell && cell.edge) {
            const item = this.edges[cell.id]
            const itemType = 'edge'
            this.sidebarReopen(item, itemType)
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

        this.zoom(up)
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
      style[mxConstants.STYLE_SOURCE_JETTY_SIZE] = 40
      style[mxConstants.STYLE_TARGET_JETTY_SIZE] = 40
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

    cellOverlay () {
      mxCellOverlay.prototype.defaultOverlap = 1.2
    },

    connectionHandler() {
      mxConstraintHandler.prototype.intersects = function(icon, point, source, existingEdge) {
        return (!source || existingEdge) || mxUtils.intersects(icon.bounds, point)
      }

      // Removes default connect logic (from center of cell)
      if (this.graph.connectionHandler.connectImage === null) {
        this.graph.connectionHandler.isConnectableCell = () => {
          return false
        }
        mxEdgeHandler.prototype.isConnectableCell = cell => {
          return this.graph.connectionHandler.isConnectableCell(cell)
        }
      }

      this.graph.getAllConnectionConstraints = function(terminal, source = false) {
        if (terminal != null && this.model.isVertex(terminal.cell) && !terminal.cell.style.includes('swimlane')) {
          let possibleConnections = [
            [0, 0],
            [0.25, 0],
            [0.5, 0],
            [0.75, 0],
            [1, 0],
            [1, 0.25],
            [1, 0.5],
            [1, 0.75],
            [1, 1],
            [0.75, 1],
            [0.5, 1],
            [0.25, 1],
            [0, 1],
            [0, 0.75],
            [0, 0.5],
            [0, 0.25],
          ]

          // Allows for multiple inbound edges on the same point, but not outbound from the same point
          if (source) {
            const edges = terminal.cell.edges || []
            edges.forEach(({ source, target, style }) => {
              const points = {}
              if (style) {
                style.split(';').forEach(point => {
                  const [key, value] = point.split('=')
                  if (key && value) {
                    points[key] = parseFloat(value)
                  }
                })
  
                possibleConnections = possibleConnections.filter(([x, y]) => {
                  // Outgoing edge, check exitX/Y
                  if (source.id === terminal.cell.id) {
                    // Filter out exit point
                    return !(x === points.exitX && y === points.exitY)
                  } else if (target.id === terminal.cell.id) {
                    // Incoming edge
                    return !(x === points.entryX && y === points.entryY)
                  }
                  return true
                })
              }
            })
          }

          return possibleConnections.map(([x, y]) => {
            return new mxConnectionConstraint(new mxPoint(x, y), true)
          })
        }

        return null
      }

      // Connect preview
      mxConnectionHandler.prototype.createEdgeState = function(me) {
        const edge = this.graph.createEdge(null, null, null, null, null)
        return new mxCellState(this.graph.view, edge, this.graph.getStylesheet().getDefaultEdgeStyle())
      }

      // Resets control points when related cells are moved
      this.graph.resetEdgesOnMove = true
      mxGraph.prototype.resetEdges = function(cells) {
        if (cells != null) {
          this.model.beginUpdate()
          try {
            cells.forEach(cell => {
              const edges = this.model.getEdges(cell)
              if (edges != null) {
                edges.forEach(edge => {
                  this.resetEdge(edge)
                })
              }

              this.resetEdges(this.model.getChildren(cell))
            })
          } finally {
            this.model.endUpdate()
          }
        }
      }

      // Image for fixed point
      mxConstraintHandler.prototype.pointImage = new mxImage(`${process.env.BASE_URL}icons/connection-point.svg`, 8, 8)

      // On hover outline for fixed point
      mxConstraintHandler.prototype.createHighlightShape = function() {
        var hl = new mxEllipse(null, '#A7D0E3', '#A7D0E3', 1)

        return hl
      }
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

      if (triggers || cell.style === 'trigger') {
        this.vertices[cell.id].triggers = triggers || {
          resourceType: null,
          eventType: null,
          constraints: [],
          enabled: true,
        }
      }
    },

    updateVertexConfig (vID) {
      const { node, config } = this.vertices[vID]
      this.vertices[vID].config = { ...config, ...(this.rendering ? {} : getKindFromStyle(node)) }
    },

    setValue (value) {
      this.graph.model.setValue(this.sidebar.item.node, value)
    },

    zoom(up = true) {
      if (up && this.graph.view.scale < 3) {
        this.graph.zoomIn()
      } else if (!up && this.graph.view.scale > 0.1) {
        this.graph.zoomOut()
      }
      this.zoomLevel = this.graph.view.scale
    },

    resetZoom () {
      this.graph.zoomTo(1)
      this.zoomLevel = this.graph.view.scale
    },

    redrawLabel (id = '') {
      if (id) {
        const state = this.graph.view.states.map[id]
        if (state) {
          this.graph.cellRenderer.redrawLabel(state)
        }
      }
    },

    async setTestInput () {
      // Can only test saved workflow
      if (this.changeDetected) {
        this.raiseWarningAlert('Save workflow first to test it', 'Test failed')
        return
      }

      // Can only test valid workflow
      if (this.hasIssues) {
        this.raiseWarningAlert('Resolve issues to test workflow', 'Test failed')
        return
      }

      this.testWorkflow()

      // Assume trigger is valid since workflow is saved and has no issues
      // const { resourceType, eventType } = this.sidebar.item.triggers
      // await this.$AutomationAPI.eventTypesList()
      //   .then(({ set }) => {
      //     const et = (set.find(et => resourceType === et.resourceType && eventType === et.eventType ) || {}).properties
      //     if (et) {
      //       this.dryRun.initialScope = et.map(p => {
      //         return { label: p.name, value: undefined }
      //       })

      //       this.dryRun.show = true
      //     } else {
      //       this.raiseWarningAlert('Event type not found', 'Test failed')
      //     }
      //     if (this.dryRun.initialScope) {
      //       this.dryRun.initialScope.map
      //     }
      //   })
      //   .catch(this.defaultErrorHandler('Failed to fetch event types'))
    },

    async testWorkflow () {
      const testParams = {
        workflowID: this.workflow.workflowID,
        stepID: this.sidebar.item.triggers.stepID,
        trace: this.workflow.canManageWorkflowSessions || false,
        wait: true,
        async: true,
      }

      const cells = {}

      this.raiseInfoAlert('Workflow test started', 'Test in progress')
      this.$AutomationAPI.workflowExec(testParams)
        .then(({ error = false, trace }) => {
          if (trace) {
            // Build cells object for easier drawing of overlay
            trace.forEach(({ stepID, parentID, stepTime, error = false }, index) => {
              const cell = {
                index,
                stepID,
                parentID,
                stepTime,
                error
              }

              if (cells[stepID]) {
                cells[stepID].push(cell)
              } else {
                cells[stepID] = [cell]
              }
            })

            // Handle first cell & edge
            new mxCellHighlight(this.graph, '#719430', 3).highlight(this.graph.view.getState(this.graph.model.getCell(this.sidebar.item.node.id)))
            const firstEdge = this.graph.model.getEdgesBetween(this.graph.model.getCell(this.sidebar.item.node.id), this.graph.model.getCell(testParams.stepID), true)[0]
            if (firstEdge) {
              new mxCellHighlight(this.graph, '#719430', 3).highlight(this.graph.view.getState(firstEdge))
            }

            // Handle others
            Object.entries(cells).forEach(([stepID, frames]) => {
              let error = frames[0].error
              let log = `#${frames[0].index + 1} - ${frames[0].stepTime}ms${error ? ' - ERROR: ' + error : ''}`
              if (frames.length < 2) {
                const [cell] = frames
                // If first cell, dont paint parent edge
                if (cell && cell.index !== 0) {
                  this.graph.model.getEdgesBetween(this.graph.model.getCell(cell.parentID), this.graph.model.getCell(stepID), true)
                    .forEach(edge => {
                      new mxCellHighlight(this.graph, '#719430', 3).highlight(this.graph.view.getState(edge))
                    })
                }
              } else {
                // If step is visited multiple times, keep track of execution info
                const time = {
                  min: frames[0].stepTime,
                  max: frames[0].stepTime,
                  avg: 0,
                  sum: 0.
                }

                error = ''

                frames.forEach(({ index, parentID, stepTime, error }, i) => {
                  if (i !== 0) {
                    if (stepTime < time.min) {
                      time.min = stepTime
                    }
  
                    if (stepTime > time.max) {
                      time.max = stepTime
                    }

                    log = `${log}<br>#${index + 1} - ${stepTime}ms${error ? ' - ERROR: ' + error : ''}`
                  }

                  time.sum += stepTime
                  this.graph.model.getEdgesBetween(this.graph.model.getCell(parentID), this.graph.model.getCell(stepID), true)
                    .forEach(edge => {
                      new mxCellHighlight(this.graph, '#719430', 3).highlight(this.graph.view.getState(edge))
                    })
                })

                time.avg = time.sum ? (time.sum / frames.length).toFixed(2) : time.sum
                log = `${log}<br><br>MIN: ${time.min}<br>MAX: ${time.max}<br>AVG: ${time.avg}<br>SUM: ${time.sum}`
              }

              // Set info overlay
              const time = new mxCellOverlay(new mxImage(`${process.env.BASE_URL}icons/clock-${error ? 'danger' : 'success'}.svg`, 16, 16), `<span>${log}</span>`)
              this.graph.addCellOverlay(this.graph.model.getCell(stepID), time)

              // Highlight cell based on error
              if (error) {
                new mxCellHighlight(this.graph, '#E54122', 3).highlight(this.graph.view.getState(this.graph.model.getCell(stepID)))
              } else {
                new mxCellHighlight(this.graph, '#719430', 3).highlight(this.graph.view.getState(this.graph.model.getCell(stepID)))
              }
            })

            // Check for trace error
            if (error) {
              throw new Error(error)
            } else {
              this.raiseSuccessAlert('Workflow test completed', 'Test completed')
            }
          } else {
            this.raiseWarningAlert('Trace not avaliable', 'Test failed')
          }
        })
        .catch(this.defaultErrorHandler('Test failed'))
    },

    render (workflow, initial = false) {
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

      // Assemble issues
      this.issues = {}
      if (this.workflow.issues) {
        this.workflow.issues.forEach(({ culprit, description }) => {
          if (culprit && culprit.step >= 0) {
            const stepID = (this.workflow.steps[culprit.step] || {}).stepID
            if (this.issues[stepID]) {
              this.issues[stepID].push(description)
            } else {
              this.issues[stepID] = [description]
            }
          }
        })
      }

      const steps = workflow.steps || []
      const paths = workflow.paths || []
      const root = this.graph.getDefaultParent()

      this.vertices = {}
      this.edges = {}

      if (initial) {
        this.graph.view.rendering = false
      }

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

        if (this.undoManager && initial) {
          this.undoManager.clear()
        }

        this.graph.getModel().endUpdate() // Updates the display

        if (initial) {
          this.graph.fit()
          this.graph.view.rendering = true
          this.graph.refresh()

          this.graph.view.setTranslate(this.graph.view.translate.x + 79, this.graph.view.translate.y + 220)
          this.zoomLevel = this.graph.view.scale
        }

        this.rendering = false
      }
    },

    getJsonModel () {
      return encodeGraph(this.graph.getModel(), this.vertices, this.edges)
    },

    saveWorkflow () {
      if (this.workflow.canUpdateWorkflow) {
        this.$emit('save', this.getJsonModel())
      } else {
        this.raiseWarningAlert('Not allowed to update workflow', 'Update failed')
      }
    }
  },
}
</script>

<style scoped lang="scss">
#graph {
  outline: none;
}

.zoom {
  right: 0;
  bottom: 0;
}
</style>

<style>
.hide {
  display: none;
}
.step:hover .hide {
  display: flex;
}

.show {
  display: flex;
}
.step:hover .show {
  display: none;
}

.id-label {
  position: absolute;
  font-size: 8px;
  top: 4px;
  right: 4px;
}
.hover-untruncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.step:hover .hover-untruncate {
  overflow: visible;
  text-overflow: initial;
}
#toolbar > hr {
  margin: 0.5rem 0 0.5rem 0 !important;
  align-self: stretch;
}
</style>
