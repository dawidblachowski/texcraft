<template>
  <div class="bg-login-background bg-cover bg-center h-screen w-screen flex flex-col items-center justify-center">
    <div class="shadow bg-[rgba(192,192,192,0.5)] backdrop-blur-md dark:bg-[rgba(0,0,0,0.5)] max-w-md">
      <ProgressBar 
        :mode="props.loading ? 'indeterminate' : 'determinate'"
        :showValue="false"
        :value="100"
        style="height: 6px"
        class="progressbar-login"
      ></ProgressBar>
      <div class="p-12">
        <slot name="content"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProgressBar from 'primevue/progressbar';
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped lang="scss">
.progressbar-login {
  background-color: transparent;
  border-radius: 0;
}
</style>
