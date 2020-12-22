<template>
  <b-container
    fluid
    class="h-100 m-0 p-0"
  >
    <router-view />
  </b-container>
</template>

<script>
export default {
  created () {
    this.$auth.check().then((user) => {
      if (!user) {
        // check performed: no error & no user,
        // redirect to auth
        throw new Error()
      }

      this.$router.push({ name: 'editor' })
    }).catch(() => {
      this.$auth.open()
    })
  }
}
</script>
