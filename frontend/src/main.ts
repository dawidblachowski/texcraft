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

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}


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

