import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@platforms/style/index.css'
import App from './App.vue'
import { router } from '@platforms/router/index'
import { Icon } from '@iconify/vue'
import VueKonva from 'vue-konva'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueKonva)
app.component('Icon', Icon)

app.mount('#app');