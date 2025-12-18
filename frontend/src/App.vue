<template>
   <div>
      <LoginModal v-if="!userStore.isAuthenticated" @login-success="handleLoginSuccess" />

      <template v-else>
         <router-view v-slot="{ Component, route }">
            <component :is="Component" :key="route.fullPath" />
         </router-view>
      </template>
   </div>
</template>

<script setup lang="ts">
import { useUserStore } from './stores/userStore';
import { onMounted } from 'vue';
import LoginModal from './components/LoginModal.vue';

const userStore = useUserStore();

onMounted(() => {
   // Cargar usuario del localStorage si existe
   userStore.loadFromStorage();
   console.log('🔄 User loaded from storage:', userStore.currentUser);
});

const handleLoginSuccess = () => {
   console.log('✅ Usuario identificado correctamente');
};
</script>
