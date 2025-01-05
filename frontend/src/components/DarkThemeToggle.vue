<template>
  <ToggleSwitch v-model="checked" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useDarkModeStore } from '../stores/darkModeStore';

const darkModeStore = useDarkModeStore();
const checked = ref(darkModeStore.isDarkMode);

onMounted(() => {
  darkModeStore.initializeDarkMode();
  checked.value = darkModeStore.isDarkMode;
});

watch(checked, (newValue) => {
  darkModeStore.toggleDarkMode(newValue);
});
</script>
