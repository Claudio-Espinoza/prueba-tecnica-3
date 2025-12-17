import { createApp } from 'vue'
import './platforms/style/index.css'
import App from './App.vue'
import { router } from '@platforms/router/index'

createApp(App).use(router).mount('#app');