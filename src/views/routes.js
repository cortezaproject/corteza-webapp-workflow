export default [
    {
      name: 'layout',
      path: '/',
      component: () => import(`./Workflow/Editor.vue`),
    },

    { path: '*', redirect: { name: 'layout' } },
]