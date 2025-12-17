import routesPublic from '@features/public/routes/index';
import { createRouter, createWebHistory } from 'vue-router';

const routes = [...routesPublic];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});