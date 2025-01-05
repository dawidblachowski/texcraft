import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { createPinia } from 'pinia'

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

app.use(pinia);
app.mount('#app');

