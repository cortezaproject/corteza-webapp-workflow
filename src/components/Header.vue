<template>
  <b-navbar class="bg-white border-bottom border-light shadow-sm">
    <b-navbar-brand>
      <b><router-link :to="{name: 'workflow.list'}" class="nav-link">Workflow</router-link></b>
    </b-navbar-brand>
    <b-navbar-nav class="mr-auto">
      <b-nav-item :to="{name: 'workflow.list'}" class="nav-link">List</b-nav-item>
    </b-navbar-nav>
  </b-navbar>
</template>

