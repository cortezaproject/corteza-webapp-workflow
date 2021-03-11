<template>
  <div>
    <b-form-group
      label-class="sticky-top bg-white pb-0"
      class="p-2 mb-0"
    >
      <template #label>
        <h5
          class="d-flex align-items-center text-primary p-2 mb-0"
        >
          Basic controls
          <font-awesome-icon
            :icon="['fas', 'mouse']"
            class="ml-2"
          />
        </h5>
      </template>
      <b-table
        :items="basicControls"
        fixed
        thead-class="d-none"
      />
    </b-form-group>
    <b-form-group
      label-class="sticky-top bg-white pb-0"
      class="p-2 mb-0"
    >
      <template #label>
        <h5
          class="d-flex align-items-center text-primary pt-2 px-2 mb-0"
        >
          Keyboard shortcuts
          <font-awesome-icon
            :icon="['fas', 'keyboard']"
            class="ml-2"
          />
        </h5>
      </template>
      <small
        class="ml-2"
      >
        If using a MAC keyboard, replace Ctrl with the CMD key
      </small>
      <b-table
        :items="keyboardShortcuts"
        fixed
        thead-class="d-none"
      />
    </b-form-group>
  </div>
</template>

<script>
export default {
  data () {
    return {
      basicControls: [
        { action: 'Select', shortcut: 'Left click'},
        { action: 'Select multiple', shortcut: 'Left click & drag'},
        { action: 'Deselect', shortcut: 'Left click on background'},
        { action: 'Pan', shortcut: 'Right click & drag'},
        { action: 'Zoom in/out', shortcut: 'Mouse wheel'},
      ],

      keyboardShortcuts: [
        { action: 'Select all', shortcut: 'Ctrl + A'},
        { action: 'Add to selection', shortcut: 'Ctrl + left mouse button'},
        { action: 'Delete selected elements', shortcut: 'Delete or Backspace'},
        { action: 'Reset view to starting point', shortcut: 'Ctrl + Space'},
        { action: 'Undo', shortcut: 'Ctrl + Z'},
        { action: 'Redo', shortcut: 'Ctrl + Shift + Z'},
        { action: 'Cut', shortcut: 'Ctrl + X'},
        { action: 'Copy', shortcut: 'Ctrl + C'},
        { action: 'Paste', shortcut: 'Ctrl + V'},
        { action: 'Save', shortcut: 'Ctrl + S'},
        { action: 'Nudge', shortcut: 'Arrow keys'},
        { action: 'Show guides', shortcut: 'Hold Alt'},
      ]
    }
  }
}
</script>

<style>

</style>