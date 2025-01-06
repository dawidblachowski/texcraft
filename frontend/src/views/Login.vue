<template>
  <LoginRegister :loading="loginPending">
    <template #content>
      <h1 class="text-3xl font-bold text-primary-900 dark:text-zinc-50">Logowanie</h1>
      <div class="flex flex-col">
        <div class="pt-5">
          <div v-if="errors.email" class="pb-2">
            <Message severity="error">{{ errors.email }}</Message>
          </div>
          <FloatLabel variant="on">
            <InputText
              v-model="email"
              :class="{ 'p-invalid': errors.email }"
              fluid
            />
            <label for="email">Email</label>
          </FloatLabel>
        </div>
        <div class="pt-5">
          <div v-if="errors.password" class="pb-2">
            <Message severity="error">{{ errors.password }}</Message>
          </div>
          <FloatLabel variant="on">
            <Password
              v-model="password"
              :feedback="false"
              toggleMask
              :class="{ 'p-invalid': errors.password }"
              fluid
            />
            <label for="password">Hasło</label>
          </FloatLabel>
        </div>
        <div class="pt-5 w-full">
          <Button
            @click="onLogin"
            label="Zaloguj się"
            icon="pi pi-user"
            class="w-full"
          />
        </div>
        <Button severity="secondary" as="router-link" to="/register" link>
          Nie masz konta?
        </Button>
      </div>
    </template>
  </LoginRegister>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import LoginRegister from '../components/LoginRegister.vue';
import { useAuthStore } from '../stores/auth.store';
import router from '../router';

const email = ref('');
const password = ref('');
const loginPending = ref(false);
const toast = useToast();
const authStore = useAuthStore();

const errors = ref<{ email: string | null; password: string | null }>({
  email: null,
  password: null,
});

const validateInputs = () => {
  let valid = true;
  errors.value.email = null;
  errors.value.password = null;
  if (!email.value) {
    errors.value.email = 'Email jest wymagany';
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.value.email = 'Nieprawidłowy email';
    valid = false;
  }
  if (!password.value) {
    errors.value.password = 'Hasło jest wymagane';
    valid = false;
  }
  return valid;
};

const onLogin = async () => {
  if (!validateInputs()) {
    return;
  }
  loginPending.value = true;
  try {
    await authStore.login(toast, email.value, password.value);
    router.push({ name: 'Home' });
  } catch (error) {
    console.error('Login failed:', error);
    toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nieprawidłowe dane logowania', life: 3000 });
  } finally {
    loginPending.value = false;
  }
};

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push({ name: 'Home' });
  }
});
</script>