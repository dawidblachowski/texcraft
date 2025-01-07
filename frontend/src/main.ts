import { createApp } from 'vue'
import './style.css'
import "./assets/styles/styles.scss"
import App from './App.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import { createPinia } from 'pinia'
import router from './router'
import { watch } from 'vue'


const pinia = createPinia()
const app = createApp(App)

app.use(PrimeVue, {
    theme: {
        preset: Aura, 
        options: {
            darkModeSelector: '.dark-mode',
            cssLayer: {
                name: 'primevue', 
                order: 'tailwind-base, primevue, tailwind-utilities'
            }
        }
    }
})

watch(pinia.state, (state) => {
    localStorage.setItem('pinia', JSON.stringify(state))
  }, { deep: true });

  
app.use(ToastService)
app.use(router);
app.use(pinia);
app.mount('#app');

