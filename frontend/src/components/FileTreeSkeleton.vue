<template>
    <div class="p-mb-6">
        <Skeleton width="w-full" height="2rem"></Skeleton>
    </div>
    <div class="p-mb-2" v-for="s in skeletonItems" :key="s">
        <Skeleton width="w-full" height="2rem"></Skeleton>
    </div>
</template>

<script setup>

import { ref } from 'vue'
const skeletonItems = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);


</script>
