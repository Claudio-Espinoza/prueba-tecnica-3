import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@platforms/style/index.css'
import App from './App.vue'
import { router } from '@platforms/router/index'
import { Icon } from '@iconify/vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('Icon', Icon)

app.mount('#app');