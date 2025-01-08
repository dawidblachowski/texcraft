<template>
    <div class="dark:bg-slate-900 bg-slate-300 w-full">
        <div class="flex justify-between items-center h-full">
            <RouterLink to="/" class="dark:text-white text-slate-900 text-lg font-bold pl-4">TexCraft</RouterLink>
            <div class="flex justify-between items-center gap-4 pr-4">
                <DarkThemeToggle />
                <span class="dark:text-white text-slate-900">{{ userStore.email }}</span>
                <Button @click="authStore.logout(toast)">Wyloguj</Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { useUserStore } from '../stores/user.store';
import { useToast } from 'primevue/usetoast';
import DarkThemeToggle from './DarkThemeToggle.vue';

const authStore = useAuthStore();
const userStore = useUserStore();
const toast = useToast();

onMounted(() => {
    userStore.fetchUserProfile();
});
</script>

<style scoped lang="scss"></style>
