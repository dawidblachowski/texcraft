<template>
    <div>Logging you in...</div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const queryParams = new URLSearchParams(window.location.search);
const accessToken = queryParams.get('accessToken');

if (accessToken) {
    authStore.accessToken = accessToken;
    authStore.isAuthenticated = true;
    localStorage.setItem('accessToken', accessToken);

    router.push({ name: 'Home' });
} else {
    router.push({ name: 'Login' });
}
</script>
