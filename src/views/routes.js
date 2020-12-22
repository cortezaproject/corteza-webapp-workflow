import { components } from '@cortezaproject/corteza-vue'

export default [
  { path: '/auth', name: 'auth', component: components.CDevAuth },
  {
    path: '',
    name: 'root',
    component: () => import(`./Layout.vue`),
    children: [
      {
        name: 'editor',
        path: 'editor',
        component: () => import(`./Workflow/Editor.vue`),
      },
    ],
  },

  { path: '*', redirect: { name: 'root' } },
]