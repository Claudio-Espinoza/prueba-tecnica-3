const routesPublic = [
    {
        path: '/',
        component: () => import('@libraries/layout/PublicLayout.vue'),
        children: [
            {
                path: '/',
                redirect: 'home',
            },
            {
                path: '/home',
                name: 'home',
                component: () => import('@features/public/view/HomeView.vue'),
            },
            {
                path: '/workplace',
                name: 'workplace',
                component: () => import('@features/public/view/WorkplaceView.vue'),
            },

        ],
    },
];

export default routesPublic;