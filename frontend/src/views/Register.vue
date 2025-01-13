<template>
    <LoginRegister :loading="registerPending">
        <template #content>
            <h1 class="text-3xl font-bold text-primary-900 dark:text-zinc-50">Rejestracja</h1>
            <div class="flex flex-col">
                <form class="flex flex-col" action="index.php">
                    <div class="pt-5">
                        <FloatLabel variant="on">
                            <InputText v-model="formEmail" inputId="username" fluid/>
                            <label for="username">Email</label>
                        </FloatLabel>
                    </div>
                    <div class="pt-5">
                        <FloatLabel variant="on">
                            <Password 
                                v-model="formPassword"
                                inputId="password"
                                toggleMask
                                fluid
                                prompt-label="Wybierz hasło"
                                weak-label="Słabe"
                                medium-label="Średnie"
                                strong-label="Silne"
                            >
                                <template #footer>
                                    <Divider />
                                    <ul class="pl-2 ml-2 my-0 leading-normal">
                                    </ul>
                                </template>
                            </Password>
                            <label for="password">Hasło</label>
                        </FloatLabel>
                    </div>
                    <div class="pt-5 w-full">
                        <Button label="Zarejestruj się" icon="pi pi-user-plus" class="w-full" severity="primary" @click="register" />
                    </div>
                </form>
                <Button as="router-link" link to="/login">Masz już konto?</Button>
            </div>
        </template>
    </LoginRegister>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LoginRegister from '../components/LoginRegister.vue';
import { useAuthStore } from '../stores/auth.store';
import router from '../router';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const authStore = useAuthStore();

if(authStore.isAuthenticated) {
  router.push({name: 'Home'});
}
const registerPending = ref(false);
const formPassword = ref('');
const formEmail = ref('');

const register = async () => {
  registerPending.value = true;
  try {
    await axios.post('/api/auth/register', {
      email: formEmail.value,
      password: formPassword.value
    });
    toast.add({severity: 'success', summary: 'Success', detail: 'Registered successfully', life: 3000});
    router.push({name: 'Login'});
  }
  catch {
    toast.add({severity: 'error', summary: 'Error', detail: 'Failed to register'});
    registerPending.value = false;
    return;
  }
};

</script>