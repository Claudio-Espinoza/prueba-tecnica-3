<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
   <header
      class="w-full h-18 px-xl py-3 gap-0 bg-neutral-50 border border-neutral-400 rounded-full flex flex-row items-center justify-between"
   >
      <div class="h-full w-fit flex flex-row justify-center items-center gap-4">
         <img src="/vite.svg" class="w-fit h-full" alt="" />
         <div class="size-full">
            <h1>Prueba Técnica 3</h1>
            <p>Estado: <a class="text-feedback-success-300">Conectado</a></p>
         </div>
      </div>
      <nav>
         <ul>
            <li><router-link to="/">Home</router-link></li>
         </ul>
      </nav>
   </header>

   <main class="size-full flex flex-row gap-l items-center justify-center">
      <router-view />
   </main>
</template>
