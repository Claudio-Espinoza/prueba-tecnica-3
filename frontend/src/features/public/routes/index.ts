const routesPublic = [
    {
        path: '/',
        redirect: '/home',
    },
    {
        path: '/home',
        name: 'home',
        component: () => import('@features/public/view/homeView.vue'),
    },
];

export default routesPublic;