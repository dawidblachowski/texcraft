<template>
  <RouterView />
  <Toast />
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth.store';
const authStore = useAuthStore();
</script>

<style>
</style>
