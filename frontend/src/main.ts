import { createApp } from 'vue'
import '@platforms/style/index.css'
import App from './App.vue'
import { router } from '@platforms/router/index'
import { Icon } from '@iconify/vue'


createApp(App).component('Icon', Icon).use(router).mount('#app');