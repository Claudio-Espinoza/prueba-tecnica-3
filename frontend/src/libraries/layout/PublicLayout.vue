<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
   <header
      class="w-full h-fit px-6 py-3 bg-neutral-50 border rounded-full border-neutral-400 flex flex-row items-center justify-between sticky top-0 z-50"
   >
      <div class="flex flex-row items-center gap-4">
         <Icon
            icon="mdi:home"
            class="w-11 h-11 text-neutral-900 cursor-pointer hover:bg-neutral-300 rounded-m hover:text-neutral-900 active:scale-95 transition-all"
            @click="router.push('/home')"
         />
         <div class="flex flex-col gap-0">
            <h1 class="text-xl font-semibold text-neutral-1000">Pagina de bienvenida</h1>
            <p class="text-neutral-700">
               Estado: <span class="text-feedback-success-300 font-medium">Conectado</span>
            </p>
         </div>
      </div>

      <div class="flex flex-row items-center gap-5">
         <div class="hidden sm:flex flex-row items-center gap-3 box-border">
            <div class="flex flex-col text-right">
               <p class="font-medium text-neutral-1000">Skibidi Toilet</p>
               <small class="text-neutral-700">Visitante</small>
            </div>
            <div
               class="h-10 w-10 rounded-md bg-amber-500 flex items-center justify-center font-semibold text-white"
            >
               V
            </div>
         </div>

         <div class="flex flex-row items-center gap-3 border-l border-neutral-500 pl-3">
            <button
               class="rounded-md text-neutral-900 hover:bg-neutral-100 active:scale-95 transition-all"
               title="Configuración"
            >
               <Icon
                  icon="weui:setting-filled"
                  class="w-11 h-11 text-neutral-900 cursor-pointer hover:bg-neutral-300 rounded-m hover:text-neutral-900 active:scale-95 transition-all"
               />
            </button>
         </div>
      </div>
   </header>

   <main class="flex flex-row gap-l size-full overflow-auto">
      <router-view />
   </main>
</template>
