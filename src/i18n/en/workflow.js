/* eslint-disable no-template-curly-in-string */
export default {
  navigation: {
    help: {
      forum: 'Help',
      documentation: 'Documentation',
      feedback: 'Send feedback',
      version: 'Version:',
    },
    userSettings: {
      loggedInAs: 'Logged in as {{user}}',
      profile: 'Profile',
      changePassword: 'Change password',
      logout: 'Logout',
    },
  },

  permission: {
    saveChanges: 'Save changes',
    resetBack: 'Reset back to "{{current}}"',
    setFor: 'Set permissions for {{target}}',
    automationWorkflow: {
      all: 'all workflows',
      specific: 'workflow "{{target}}"',

      operations: {
        read: {
          title: 'Read any workflow',
          specific: 'Read this workflow',
          description: 'Default: deny',
        },
        update: {
          title: 'Update any workflow',
          specific: 'Update this workflow',
          description: 'Default: deny',
        },
        delete: {
          title: 'Delete any workflow',
          specific: 'Delete this workflow',
          description: 'Default: deny',
        },
        undelete: {
          title: 'Undelete any workflow',
          specific: 'Undelete this workflow',
          description: 'Default: deny',
        },
        execute: {
          title: 'Execute any workflow',
          specific: 'Execute this workflow',
          description: 'Default: deny',
        },
        triggersManage: {
          title: 'Manage all triggers',
          specific: 'Manage triggers for this workflow',
          description: 'Default: deny',
        },
        sessionsManage: {
          title: 'Manage all sessions',
          specific: 'Manage sessions for this workflow',
          description: 'Default: deny',
        },
      },
    },
  },
}
