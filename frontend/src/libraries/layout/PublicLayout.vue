<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/userStore';
import { Icon } from '@iconify/vue';

const router = useRouter();
const userStore = useUserStore();

const handleLogout = async () => {
   if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      await userStore.logout();
      router.push('/');
   }
};
</script>

<template>
   <div class="w-full h-screen flex flex-col">
      <header
         class="w-full h-fit px-6 py-3 bg-neutral-50 border rounded-full border-neutral-400 flex flex-row items-center justify-between top-0 z-50 flex-shrink-0"
      >
         <div class="flex flex-row items-center gap-2">
            <Icon
               icon="mdi:home"
               class="w-10 h-10 text-neutral-900 cursor-pointer hover:bg-neutral-300 rounded-m hover:text-neutral-900 active:scale-95 transition-all"
               @click="router.push('/home')"
            />
            <div class="flex flex-col gap-0">
               <h1 class="text-xl font-bold">Mis Espacios de Trabajo</h1>
               <p class="text-gray-600">Usuarios online: {{ userStore.userCount }}</p>
            </div>
         </div>

         <div class="flex flex-row items-center gap-5">
            <div class="hidden sm:flex flex-row items-center gap-2 box-border">
               <div class="flex flex-col text-right">
                  <p class="font-medium text-neutral-1000">
                     {{ userStore.currentUser?.name || 'Usuario' }}
                  </p>
                  <small
                     :class="
                        userStore.isConnected
                           ? 'not-italic text-green-600 font-medium'
                           : 'not-italic text-red-600 font-medium'
                     "
                  >
                     <p>{{ userStore.isConnected ? 'Conectado' : 'Desconectado' }}</p>
                  </small>
               </div>
               <div
                  class="h-10 w-10 rounded-md bg-amber-500 flex items-center justify-center font-semibold text-white"
               >
                  {{ userStore.currentUser?.name?.[0]?.toUpperCase() || 'U' }}
               </div>
            </div>

            <div class="flex flex-row items-center gap-3 border-l border-neutral-500 pl-3">
               <button
                  @click="handleLogout"
                  class="rounded-md text-neutral-900 hover:bg-neutral-100 active:scale-95 transition-all"
                  title="Cerrar sesión"
               >
                  <Icon
                     icon="iconamoon:exit-fill"
                     class="w-10 h-10 text-neutral-900 cursor-pointer hover:bg-neutral-300 rounded-m hover:text-neutral-900 active:scale-95 transition-all"
                  />
               </button>
            </div>
         </div>
      </header>

      <main class="w-full h-full overflow-auto flex flex-row gap-6 box-border">
         <router-view />
      </main>
   </div>
</template>
