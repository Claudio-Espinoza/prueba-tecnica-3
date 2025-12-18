const routesPublic = [
    {
        path: '/',
        component: () => import('@libraries/layout/PublicLayout.vue'),
        children: [
            {
                path: '/home',
                name: 'home',
                component: () => import('@features/public/view/HomeView.vue'),
            },
            {
                path: '/',
                redirect: 'home',
            },
        ],
    },
];

export default routesPublic;