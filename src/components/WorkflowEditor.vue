<template>
  <div
    id="editor"
    ref="editor"
    class="h-100 d-flex"
    @keydown="keybinds"
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
            v-b-modal.help
            variant="link"
            class="p-0"
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
          v-if="workflow.meta"
          class="position-absolute pl-3 pt-2 w-100 mw-100"
          style="z-index: 1;"
        >
          <div
            class="d-flex align-items-center"
            :class="{ 'mb-2': workflow.meta.description }"
          >
            <b-button
              v-b-modal.workflow
              variant="link"
              class="p-0 mr-3"
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
            :disabled="!canUpdateWorkflow"
            @click="saveWorkflow()"
          >
            Changes detected {{ `${canUpdateWorkflow ? 'Click here to save.' : ''}` }}
          </b-button>
        </div>

        <div
          id="graph"
          ref="graph"
          class="h-100 p-0"
        />
      </b-card-body>
    </b-card>

    <!--
      no-enforce-focus flag doesn't set focus to sidebar when it is opened.
      Bad for Accesability, since keyboard only users can't use sidebar.
     -->
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
            size-confirm="md"
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
      :hide-header-close="workflow.workflowID === '0'"
      :no-close-on-backdrop="workflow.workflowID === '0'"
      :no-close-on-esc="workflow.workflowID === '0'"
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

      <div
        class="d-flex mb-3"
      >
        <import
          :disabled="importProcessing"
          @import="importJSON"
        />

        <export
          v-if="workflow.workflowID && workflow.workflowID !== '0'"
          :workflows="[workflow.workflowID]"
          :file-name="workflow.handle"
          class="ml-1"
        />
      </div>
      <workflow-configurator
        v-if="workflow.workflowID"
        :workflow="workflow"
        @delete="$emit('delete')"
      />

      <template #modal-footer>
        <div
          class="d-flex w-100"
        >
          <c-input-confirm
            v-if="workflow.canDeleteWorkflow"
            size="md"
            size-confirm="md"
            :borderless="false"
            @confirmed="$emit('delete')"
          >
            Delete
          </c-input-confirm>

          <b-button
            variant="primary"
            class="ml-auto"
            @click="saveWorkflow()"
          >
            Save
          </b-button>
        </div>
      </template>
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

    <b-modal
      id="dry-run"
      v-model="dryRun.show"
      size="lg"
      title="Initial scope"
      scrollable
      :body-class="dryRun.lookup ? '' : 'p-1'"
      :ok-only="dryRun.lookup"
      :ok-title="`${dryRun.lookup ? 'Load and Configure' : 'Run Workflow'}`"
      cancel-title="Back"
      ok-variant="success"
      @cancel.prevent="dryRun.lookup = true"
      @ok="dryRunOk"
    >
      <div
        v-if="dryRun.lookup"
      >
        <small>
          The initial scope gets injected into the workflow at execution. To load available variables, input the related IDs/Handles below<br>
          If you do not wish to load any variables, click "Configure" to modify the initial scope before running workflow<br>
          Variables that can't be loaded will be auto initialized as empty
          <br><br>
          WARNING: If prompts are used in the workflow, make sure that the related webapp is also opened. Otherwise workflow will timeout
        </small>
        <div
          v-for="(p, index) in Object.values(dryRun.initialScope)"
          :key="index"
          class="mt-4"
        >
          <b-form-group
            v-if="p.lookup"
            :label="p.label"
            :description="p.description"
          >
            <b-form-input
              v-model="p.value"
            />
          </b-form-group>
        </div>
      </div>
      <div
        v-else
        class="h-100"
      >
        <vue-json-editor
          :value="dryRun.input"
          :options="{ name: 'Initial Scope' }"
          class="h-100"
          @input="onDryRunEdit"
        />
      </div>
    </b-modal>
  </div>
</template>

<script>
import mxgraph from 'mxgraph'
import Vue from 'vue'
import { encodeGraph } from '../lib/codec'
import { getStyleFromKind, getKindFromStyle } from '../lib/style'
import { encodeInput } from '../lib/dry-run'
import toolbarConfig from '../lib/toolbar'
import Configurator from '../components/Configurator'
import Tooltip from '../components/Tooltip.vue'
import WorkflowConfigurator from '../components/Configurator/Workflow'
import Help from '../components/Help'
import VueJsonEditor from 'v-jsoneditor'
import Import from '../components/Import'
import Export from '../components/Export'

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
  mxPoint,
  mxRectangle,
  mxLog,
  mxImage,
  mxConstraintHandler,
  mxConnectionConstraint,
  mxCellState,
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
    Help,
    VueJsonEditor,
    Import,
    Export,
  },

  props: {
    workflowObject: {
      type: Object,
      default: () => {},
    },

    workflowTriggers: {
      type: Array,
      default: () => [],
    },

    changeDetected: {
      type: Boolean,
      default: false,
    },

    canCreate: {
      type: Boolean,
      default: false,
    },
  },

  data () {
    return {
      initialized: false,

      graph: undefined,
      keyHandler: undefined,
      undoManager: undefined,

      workflow: {},
      triggers: [],
      vertices: {},
      edges: {},
      issues: {},

      highlights: {
        success: undefined,
        error: undefined,
      },

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
        show: false,
        processing: false,
        lookup: false,
        cellID: undefined,
        initialScope: {},
        input: {},
        inputEdited: {},
      },

      importProcessing: false,

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
      return undefined
    },

    getSelectedItem () {
      return this.sidebar.item ? this.sidebar.item : undefined
    },

    getZoomPercent () {
      return `${Math.floor(this.zoomLevel * 100).toFixed(0)}%`
    },

    canUpdateWorkflow () {
      return this.workflow.workflowID === '0' ? this.canCreate : this.workflow.canUpdateWorkflow
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
    },
  },

  watch: {
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
      },
    },

    workflowObject: {
      immediate: true,
      handler (workflow) {
        // If first save was successful, close workflow configurator modal
        if (workflow.workflowID !== this.workflow.workflowID) {
          this.$bvModal.hide('workflow')
        }

        this.workflow = workflow

        // Every change to workflowObject from parent component after initial render triggers rerender
        if (this.initialized) {
          this.render(this.workflow)
        }
      },
    },

    workflowTriggers: {
      immediate: true,
      handler (triggers) {
        this.triggers = triggers
      },
    },
  },

  mounted () {
    try {
      if (!mxClient.isBrowserSupported()) {
        throw new Error(mxUtils.error('Browser is not supported!', 200, false))
      }

      mxEvent.disableContextMenu(this.$refs.graph)
      this.graph = new mxGraph(this.$refs.graph, null, mxConstants.DIALECT_STRICTHTML)
      this.keyHandler = new mxKeyHandler(this.graph)

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

      // Open workflow configurator if workflow is new
      if (this.workflow.workflowID && this.workflow.workflowID === '0') {
        this.$bvModal.show('workflow')
      }

      this.initialized = true
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
        const mxObjectId = this.sidebar.item.node.mxObjectId
        this.sidebar.item = undefined
        this.sidebar.itemType = undefined
        this.redrawLabel(mxObjectId)
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
        this.redrawLabel(item.node.mxObjectId)
      } else {
        // If item already opened in sidebar, keep open
        if (this.sidebar.item && item.node.id === this.sidebar.item.node.id) {
          return
        }

        // Otherwise reopen completely
        this.sidebar.show = false
        this.sidebar.outEdges = (item.node.edges || []).length
        const oldMxObjectId = ((this.getSelectedItem || {}).node || {}).mxObjectId
        this.sidebar.item = item
        this.sidebar.itemType = itemType
        this.redrawLabel(oldMxObjectId)
        this.redrawLabel(item.node.mxObjectId)
        setTimeout(() => {
          this.sidebar.show = !this.sidebar.show
        }, 300)
      }
    },

    setup () {
      this.graph.zoomFactor = 1.2

      // Sets a background image and restricts child movement to its bounds
      this.graph.setBackgroundImage(new mxImage(`${process.env.BASE_URL}icons/grid.svg`, 8192, 8192))
      this.graph.maximumGraphBounds = new mxRectangle(0, 0, 8192, 8192)
      this.graph.gridSize = 8

      this.graph.setPanning(true)
      this.graph.setConnectable(true)
      this.graph.setAllowDanglingEdges(false)
      this.graph.setTooltips(true)
      /* eslint-disable no-new */
      new mxRubberband(this.graph) // Enables multiple selection
      this.graph.edgeLabelsMovable = false

      // Prevent showing tooltips on regular cells, just show overlay
      this.graph.getTooltipForCell = () => {}

      // Enables guides
      mxGraphHandler.prototype.guidesEnabled = true

      // Prevent cloning with ctrl + drag
      mxGraphHandler.prototype.cloneEnabled = false

      // Alt disables guides
      mxGraphHandler.prototype.useGuidesForEvent = (evt) => {
        return mxEvent.isAltDown(evt.getEvent())
      }

      const mxGraphHandlerIsValidDropTarget = mxGraphHandler.prototype.isValidDropTarget
      mxGraphHandler.prototype.isValidDropTarget = function (target, me) {
        return mxGraphHandlerIsValidDropTarget.apply(this, arguments) && !target.edge
      }

      mxEdgeHandler.prototype.snapToTerminals = true

      mxGraph.prototype.minFitScale = 1
      mxGraph.prototype.maxFitScale = 1

      this.graph.isHtmlLabel = cell => {
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
            const shadow = ((this.getSelectedItem || {}).node || {}).id === cell.id ? 'shadow-lg' : 'shadow'
            const cog = `${process.env.BASE_URL}icons/cog.svg`
            const issue = `${process.env.BASE_URL}icons/issue.svg`
            const playIcon = `${process.env.BASE_URL}icons/play.svg`
            const opacity = vertex.config.kind === 'trigger' && !vertex.triggers.enabled ? 'opacity: 0.7;' : ''

            let play = ''
            let issues = ''
            let id = ''
            if (this.issues[cell.id]) {
              issues = `<img id="openIssues" src="${issue}" class="ml-2 pointer" style="width: 20px;"/>`
            } else {
              id = `<span class="show id-label">${cell.id}</span>`
            }

            // Add play button to triggers
            if (!this.dryRun.processing && this.workflow.canExecuteWorkflow && vertex.triggers && vertex.triggers.triggerID) {
              play = `<img id="testWorkflow" src="${playIcon}" class="mr-1 hide pointer" style="width: 20px;"/>`
            }

            label = `<div class="d-flex flex-column position-relative bg-white rounded step ${shadow}" style="width: 200px; height: 80px; border-radius: 5px;${opacity}">` +
                      '<div class="d-flex flex-row align-items-center text-primary px-2 my-1 h6 mb-0 font-weight-bold" style="height: 35px;">' +
                        `<img src="${icon}" class="mr-2"/>${type}` +
                        '<div class="d-flex h-100 ml-auto align-items-center">' +
                          play +
                          `<img id="openSidebar" src="${cog}" class="hide pointer" style="width: 20px;"/>` +
                          id +
                          issues +
                        '</div>' +
                      '</div>' +
                      '<div class="d-flex flex-row align-items-center hover-untruncate border-top px-2 mb-0 h6" style="height: 45px; color: #2D2D2D;">' +
                        `<span class="d-inline-block bg-white hover-untruncate py-2 pr-2">${cell.value || '/'}</span>` +
                      '</div>' +
                    '</div>'
          } else {
            label = `<div id="openSidebar" class="d-flex"><span class="d-inline-block h6 mb-0 text-truncate">${cell.value || ''}</span></div>`
          }
        }

        return label
      }

      this.graph.isCellEditable = () => {
        return false
      }

      // Disables mxGraph console window
      mxLog.setVisible = () => {}

      mxGraph.prototype.expandedImage = undefined

      if (mxClient.IS_QUIRKS) {
        document.body.style.overflow = 'hidden'
        /* eslint-disable no-new */
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

    initToolbar () {
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
          style,
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
              ...cellStyle,
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
      const cell = edge ? this.edges[id] : this.vertices[id]
      const node = this.graph.model.cloneCell(cell.node, false)
      node.id = cell.node.id
      node.parent = cell.node.parent.id

      if (edge) {
        node.source = cell.node.source.id
        node.target = cell.node.target.id
      }

      const cellCopy = {
        node,
      }

      // Need to use JSON.parse to remove references
      if (cell.config) {
        cellCopy.config = JSON.parse(JSON.stringify(cell.config))
      }

      if (cell.triggers) {
        const triggers = {
          enabled: cell.triggers.enabled,
          constraints: cell.triggers.constraints,
          eventType: cell.triggers.eventType,
          resourceType: cell.triggers.resourceType,
        }

        cellCopy.triggers = JSON.parse(JSON.stringify(triggers))
      }

      return cellCopy
    },

    initClipboard () {
      const absoluteGeometry = (cell) => {
        // If parent not container cell
        if (!cell.parent.geometry) {
          return {
            x: cell.geometry.x,
            y: cell.geometry.y,
          }
        }

        // Get absoluteGeometry recursively
        const { x, y } = absoluteGeometry(cell.parent)
        return {
          x: cell.geometry.x + x,
          y: cell.geometry.y + y,
        }
      }

      const copyCells = (cells, parentID) => {
        let copiedCells = {}
        let copiedEdges = []

        cells.forEach(cell => {
          const newCell = this.makeCellCopy(cell)

          if (cell.edge) {
            copiedEdges.push(newCell)
          } else {
            if (!copiedCells[cell.parent.id]) {
              copiedCells[cell.parent.id] = []
            }

            // Cell parent is container cell, and copyCells wasn't called by parent of curent cell
            if (cell.parent.geometry && cell.parent.id !== parentID) {
              // Get relative x,y recursively - Needed because of relative x,y in swimlanes. And paste not respecting relative x,y
              const { x, y } = absoluteGeometry(cell)
              newCell.node.geometry.x = x
              newCell.node.geometry.y = y
            }

            copiedCells[cell.parent.id].push(newCell)

            // Handle children
            if (cell.children) {
              if (!copiedCells[cell.id]) {
                copiedCells[cell.id] = []
              }

              // Recursively copy children
              const childrenCells = copyCells(cell.children, cell.id)
              copiedCells = { ...copiedCells, ...childrenCells.cells }
              copiedEdges = [...copiedEdges, ...childrenCells.edges]
            }
          }
        })

        return {
          cells: copiedCells,
          edges: copiedEdges,
        }
      }

      const pasteCells = (evt) => {
        // Get cells from actual system clipboard
        const { cells = {}, edges = [] } = JSON.parse(evt.clipboardData.getData('text')) || {}

        const delta = mxClipboard.insertCount * this.graph.gridSize
        const defaultParent = this.graph.getDefaultParent()
        const newCellIDs = {}
        const allCells = []

        this.graph.getModel().beginUpdate()

        // Handle cells
        Object.entries(cells).forEach(([parentID, children]) => {
          children.forEach(({ node, ...rest }) => {
            const parent = newCellIDs[parentID] ? this.graph.model.getCell(newCellIDs[parentID]) : defaultParent
            const { id, geometry, value, style } = node

            // Offset only the topmost cell. Children are relative and will be offset automaticially
            if (!newCellIDs[parentID]) {
              geometry.x += delta
              geometry.y += delta
            }

            const newVertex = this.graph.insertVertex(parent, null, value, geometry.x, geometry.y, geometry.width, geometry.height, style)
            allCells.push(newVertex)

            newCellIDs[id] = newVertex.id
            rest.config.stepID = newVertex.id

            this.vertices[newVertex.id] = { node: newVertex, ...rest }
          })
        })

        // Handle edges
        edges.forEach(({ node, ...rest }) => {
          const parent = newCellIDs[node.id] ? this.graph.model.getCell(newCellIDs[node.id]) : defaultParent
          const { id, geometry, value, style } = node

          node.source = this.vertices[newCellIDs[rest.config.parentID || node.source]].node
          node.target = this.vertices[newCellIDs[rest.config.childID || node.target]].node

          const newEdge = this.graph.insertEdge(parent, null, value, node.source, node.target, style)
          newEdge.geometry.points = (geometry.points || []).map(({ x, y }) => {
            return new mxPoint(x, y)
          })
          allCells.push(newEdge)

          newCellIDs[id] = newEdge.id
          rest.config.parentID = node.source.id
          rest.config.childID = node.target.id

          this.edges[newEdge.id] = { node: newEdge, ...rest }
        })

        Object.keys(this.vertices).forEach(vID => this.updateVertexConfig(vID))

        mxClipboard.insertCount++
        this.graph.setSelectionCells(allCells)
        this.graph.getModel().endUpdate() // Updates the display
      }

      mxClipboard.copy = (graph, cells) => {
        const exportableCells = graph.getExportableCells(graph.model.getTopmostCells(cells || graph.getSelectionCells()))
        const copiedCells = copyCells(exportableCells)

        // Copy to actual browser(system) clipboard
        const editor = this.$refs.editor
        const tempInput = document.createElement('input')
        editor.appendChild(tempInput)
        tempInput.setAttribute('value', JSON.stringify(copiedCells))
        tempInput.select()
        document.execCommand('copy')
        editor.removeChild(tempInput)

        mxClipboard.insertCount = 1

        return copiedCells
      }

      mxClipboard.cut = (graph, cells) => {
        const copiedCells = mxClipboard.copy(graph, cells)

        const cutCells = []
        Object.entries(copiedCells.cells).forEach(([parentID, children]) => {
          children.forEach(({ node }) => {
            cutCells.push(this.graph.model.getCell(node.id))
          })
        })

        copiedCells.edges.forEach(({ node }) => {
          cutCells.push(this.graph.model.getCell(node.id))
        })

        mxClipboard.insertCount = 0
        this.graph.removeCells(cutCells)

        return cells
      }

      // Register paste handler
      document.querySelector('body').addEventListener('paste', pasteCells)
    },

    // Works on all of editor (mostly)
    keybinds (event) {
      // Ctrl + S
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        this.saveWorkflow()
        event.preventDefault()
      }
    },

    // Only works when canvas is focused
    keys () {
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

      // Ctrl + A
      this.keyHandler.controlKeys[65] = () => {
        this.graph.selectAll()
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
          const delta = evt.shiftKey ? this.graph.gridSize : this.graph.gridSize * 5

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

    events () {
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
            this.edges[node.id].node.value = 'If'
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
            const source = this.vertices[cell.source.id]
            const target = this.vertices[cell.target.id]

            // If exlusive gateway, update edge indexes (#n)
            if (source.config.kind === 'gateway') {
              if (source.config.ref === 'excl') {
                source.node.edges.filter(e => e.source.id === source.node.id).forEach((edge, index) => {
                  /* eslint-disable no-unused-vars */
                  const [edgeID, ...rest] = edge.value.split(' - ')

                  this.edges[edge.id].node.value = `#${index + 1} - ${rest.join(' - ')}`
                  this.redrawLabel(edge.mxObjectId)
                })
              }

              if (['join', 'fork'].includes(target.config.ref)) {
                this.updateVertexConfig(source.node.id)
              }
            } else if (source.config.kind === 'iterator' || source.config.kind === 'error-handler') {
              // Since later placed edges will have greater id than the ones placed before, we can filter by id
              // Remove all edges that were placed after the one that was just deleted.
              // This needs to be done to preserve edge order
              this.graph.removeCells(source.node.edges.filter(e => e.source.id === source.node.id && e.id > cell.id))
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
            // If clicked on Cog icon
            if (event.target.id === 'openSidebar') {
              const item = cell.edge ? this.edges[cell.id] : this.vertices[cell.id]
              const itemType = cell.edge ? 'edge' : item.config.kind
              this.sidebarReopen(item, itemType)
            } else if (event.target.id === 'openIssues') {
              this.issuesModal.issues = this.issues[cell.id]
              this.issuesModal.show = true
            } else if (event.target.id === 'testWorkflow') {
              this.dryRun.cellID = cell.id
              this.loadTestScope()
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
        const cell = evt.getProperty('cell')
        if (event && cell) {
          const isVisual = ((this.vertices[cell.id] || {}).config || {}).kind === 'visual'
          if (cell.edge || isVisual) {
            const item = cell.edge ? this.edges[cell.id] : this.vertices[cell.id]
            const itemType = cell.edge ? 'edge' : item.config.kind
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
          this.removeDryRunOverlay()
          this.$root.$emit('change-detected')
        }
      })
    },

    styling () {
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

    connectionHandler () {
      mxConstraintHandler.prototype.intersects = function (icon, point, source, existingEdge) {
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

      this.graph.getAllConnectionConstraints = function (terminal, source = false) {
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
      mxConnectionHandler.prototype.createEdgeState = function (me) {
        const edge = this.graph.createEdge(null, null, null, null, null)
        return new mxCellState(this.graph.view, edge, this.graph.getStylesheet().getDefaultEdgeStyle())
      }

      // Resets control points when related cells are moved
      this.graph.resetEdgesOnMove = true
      mxGraph.prototype.resetEdges = function (cells) {
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
      mxConstraintHandler.prototype.createHighlightShape = function () {
        var hl = new mxEllipse(null, '#A7D0E3', '#A7D0E3', 1)

        return hl
      }
    },

    addToolbarItem (title, graph, toolbar, prototype, icon, tooltip) {
      const funct = (graph, evt, cell) => {
        graph.stopEditing(false)

        const pt = graph.getPointForEvent(evt)
        const vertex = graph.getModel().cloneCell(prototype)
        vertex.geometry.x = pt.x
        vertex.geometry.y = pt.y

        graph.importCells([vertex], 0, 0, cell)
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
        propsData: { title, kind: img.id, img: icon, text: tooltip },
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
          ...(this.rendering ? {} : getKindFromStyle(cell)),
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

    zoom (up = true) {
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

    removeDryRunOverlay () {
      if (this.highlights.length > 0) {
        this.highlights.forEach(h => {
          h.destroy()
        })
        this.highlights = []
        this.graph.clearCellOverlays()
      }
    },

    async loadTestScope () {
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

      const lookupableTypes = [
        'record',
        'oldRecord',
        'module',
        'oldModule',
        'page',
        'oldPage',
        'namespace',
        'oldNamespace',
        'user',
        'oldUser',
        'role',
        'oldRole',
        'application',
        'oldApplication',
      ]

      // Assume trigger is valid since workflow is saved and has no issues
      const { resourceType, eventType } = this.vertices[this.dryRun.cellID].triggers
      await this.$AutomationAPI.eventTypesList()
        .then(({ set }) => {
          const et = (set.find(et => resourceType === et.resourceType && eventType === et.eventType) || {}).properties
          if (et) {
            // Flag to check if lookup should be opened, or JSON editor
            let lookup = false
            if (et.length) {
              this.dryRun.initialScope = et.reduce((initialScope, p) => {
                let label = `${p.name}${lookupableTypes.includes(p.name) ? ' (ID)' : ''}`
                if (p.type === 'ComposeNamespace' || p.type === 'ComposeModule') {
                  label = `${p.name} (Handle)`
                }

                let description = ''
                if (p.type === 'ComposeRecord') {
                  description = 'Namespace and Module required'
                } else if (p.type === 'ComposeModule' || p.name === 'page' || p.name === 'oldPage') {
                  description = 'Namespace required'
                }

                initialScope[p.name] = ({
                  label,
                  value: (this.dryRun.initialScope[p.name] || {}).value,
                  lookup: lookupableTypes.includes(p.name),
                  description,
                })

                lookup = lookup ? true : lookupableTypes.includes(p.name)
                return initialScope
              }, {})

              // Set initial values for unlookable types
              encodeInput(this.dryRun.initialScope, this.$ComposeAPI, this.$SystemAPI)
                .then(input => {
                  this.dryRun.input = input
                  this.dryRun.lookup = lookup
                  this.dryRun.show = true
                })
                .catch(this.defaultErrorHandler('Failed to load initial scope'))
            } else {
              // If no constraints, just run
              this.dryRun.initialScope = {}
              this.testWorkflow()
            }
          } else {
            this.raiseWarningAlert('Event type not found', 'Test failed')
          }
        })
        .catch(this.defaultErrorHandler('Failed to fetch event types'))
    },

    async dryRunOk (e) {
      if (this.dryRun.lookup) {
        e.preventDefault()
        // Lookup based on provided ids
        encodeInput(this.dryRun.initialScope, this.$ComposeAPI, this.$SystemAPI)
          .then(input => {
            this.dryRun.input = input
            this.dryRun.inputEdited = input
            this.dryRun.lookup = false
          })
          .catch(this.defaultErrorHandler('Failed to load initial scope'))
      } else {
        this.testWorkflow(this.dryRun.inputEdited)
      }
    },

    onDryRunEdit (e) {
      this.dryRun.inputEdited = e
    },

    async testWorkflow (input = {}) {
      this.removeDryRunOverlay()
      this.dryRun.processing = true
      this.redrawLabel(this.graph.model.getCell(this.dryRun.cellID).mxObjectId)

      const testParams = {
        workflowID: this.workflow.workflowID,
        stepID: this.vertices[this.dryRun.cellID].triggers.stepID,
        trace: this.workflow.canManageWorkflowSessions || false,
        wait: true,
        async: true,
        input,
      }

      const cells = {}

      this.raiseInfoAlert('Workflow test started', 'Test in progress')
      await this.$AutomationAPI.workflowExec(testParams)
        .then(({ error = false, trace }) => {
          if (trace) {
            // Build cells object for easier drawing of overlay
            trace.forEach(({ stepID, parentID, stepTime, error = false }, index) => {
              const cell = {
                index,
                stepID,
                parentID,
                stepTime,
                error,
              }

              if (cells[stepID]) {
                cells[stepID].push(cell)
              } else {
                cells[stepID] = [cell]
              }
            })

            this.highlights = []

            // Handle first cell & edge
            this.highlights[this.highlights.push(new mxCellHighlight(this.graph, '#719430', 3)) - 1].highlight(this.graph.view.getState(this.graph.model.getCell(this.dryRun.cellID)))
            const firstEdge = this.graph.model.getEdgesBetween(this.graph.model.getCell(this.dryRun.cellID), this.graph.model.getCell(testParams.stepID), true)[0]
            if (firstEdge) {
              this.highlights[this.highlights.push(new mxCellHighlight(this.graph, '#719430', 3)) - 1].highlight(this.graph.view.getState(firstEdge))
            }

            // Handle others
            Object.entries(cells).forEach(([stepID, frames]) => {
              if (stepID !== '0') {
                let error = frames[0].error
                let log = `#${frames[0].index + 1} - ${frames[0].stepTime}ms${error ? ' - ERROR: ' + error : ''}`
                if (frames.length < 2) {
                  const [cell] = frames
                  // If first cell, dont paint parent edge
                  if (cell && cell.index !== 0) {
                    this.graph.model.getEdgesBetween(this.graph.model.getCell(cell.parentID), this.graph.model.getCell(stepID), true)
                      .forEach(edge => {
                        this.highlights[this.highlights.push(new mxCellHighlight(this.graph, '#719430', 3)) - 1].highlight(this.graph.view.getState(edge))
                      })
                  }
                } else {
                  // If step is visited multiple times, keep track of execution info
                  const time = {
                    min: frames[0].stepTime,
                    max: frames[0].stepTime,
                    avg: 0,
                    sum: 0.0,
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
                        this.highlights[this.highlights.push(new mxCellHighlight(this.graph, '#719430', 3)) - 1].highlight(this.graph.view.getState(edge))
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
                  this.highlights[this.highlights.push(new mxCellHighlight(this.graph, '#E54122', 3)) - 1].highlight(this.graph.view.getState(this.graph.model.getCell(stepID)))
                } else {
                  this.highlights[this.highlights.push(new mxCellHighlight(this.graph, '#719430', 3)) - 1].highlight(this.graph.view.getState(this.graph.model.getCell(stepID)))
                }
              }
            })

            // Check for trace error
            if (error) {
              throw new Error(error)
            } else {
              this.raiseSuccessAlert('Workflow test completed', 'Test completed')
            }
          } else {
            this.raiseWarningAlert('Trace not available', 'Test completed')
          }

          this.dryRun.lookup = true
        })
        .catch(this.defaultErrorHandler('Test failed'))
        .finally(() => {
          this.dryRun.processing = false
          this.redrawLabel(this.graph.model.getCell(this.dryRun.cellID).mxObjectId)
        })
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
          meta,
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
        // Add vertices
        steps.sort((a, b) => a.meta.visual.parent - b.meta.visual.parent)
          .forEach(({ meta = {}, ...config }) => {
            const node = (meta || {}).visual
            if (node) {
              node.parent = this.graph.model.getCell(node.parent) || root

              const { width, height, style } = getStyleFromKind(config)

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
              config,
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

        // Resolves problems with same id's being reused
        this.graph.getModel().nextId = this.graph.getModel().nextId + 1

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

    importJSON (workflows = []) {
      this.importProcessing = true

      // Only render first workflow
      const [workflow] = workflows

      // Replace triggers
      this.triggers = workflow.triggers || []

      // Replace workflow steps and paths
      this.workflow = {
        ...this.workflow,
        steps: workflow.steps || [],
        paths: workflow.paths || [],
      }

      // Fresh render
      this.render(this.workflow)

      this.importProcessing = false
      this.$root.$emit('change-detected')
    },

    saveWorkflow () {
      // Just emit, let parent component take care of permission checks
      this.$emit('save', { ...this.workflow, ...this.getJsonModel() })
    },
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
