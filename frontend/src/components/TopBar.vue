<template>
    <div class="dark:bg-slate-900 bg-slate-300 w-full">
        <div class="flex justify-between items-center h-full">
            <RouterLink to="/" class="dark:text-white text-slate-900 text-lg font-bold pl-4">TexCraft</RouterLink>
            <div class="flex justify-between items-center gap-4 pr-4">
                <Button @click="authStore.logout(toast)">Logout</Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth.store';
import { useToast } from 'primevue/usetoast';

const authStore = useAuthStore();
const toast = useToast();
</script>

<style scoped lang="scss"></style>
