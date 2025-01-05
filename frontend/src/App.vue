<template>
  <DarkThemeToggle />
  <div v-if="postsloading">
    <h1>Loading...</h1>
  </div>
  <div v-else>
    <div v-for="post in posts" :key="String(post.id)">
      <h1>{{ post.title }}</h1>
      <p>{{ post.content }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import type { PostDto } from '@shared/dto/post.dto';
import DarkThemeToggle from './components/DarkThemeToggle.vue';

const postsloading = ref(true);
const posts = ref([] as PostDto[]);

axios.get('/api')
  .then((response) => {
    posts.value = response.data;
    postsloading.value = false;
  })
  .catch((error) => {
    console.log(error);
  });
</script>

<style>
</style>
