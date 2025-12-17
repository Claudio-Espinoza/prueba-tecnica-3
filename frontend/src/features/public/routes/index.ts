const routesPublic = [
    {
        path: '/',
        component: () => import('@libraries/layout/PublicLayout.vue'),
        children: [
            {
                path: '',
                name: 'home',
                component: () => import('@features/public/view/HomeView.vue'),
            },
            {
                path: 'home',
                redirect: '/',
            },
        ],
    },
];

export default routesPublic;