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
import { socketService } from './services/socketService';

const userStore = useUserStore();

const setupSocketListeners = () => {
   // Escuchar actualizaciones de presencia
   socketService.onPresenceUsers((data) => {
      console.log('👥 Usuarios conectados:', data.users.length);
      userStore.setOnlineUsers(data.users);
   });

   // Escuchar cuando se crea un board
   socketService.onBoardCreated((board) => {
      console.log('📋 Nuevo tablero creado:', board.name);
   });

   // Escuchar lista de boards
   socketService.onBoardList((data) => {
      console.log('📋 Tableros disponibles:', data.boards?.length || 0);
   });

   // Escuchar datos del board actual
   socketService.onBoardData((data) => {
      console.log('📊 Datos del tablero cargados');
   });

   // Escuchar cuando alguien se une al workspace
   socketService.onBoardUserJoined((data) => {
      console.log('👤 Usuario se unió:', data.user.name);
   });

   // Escuchar cuando alguien deja el workspace
   socketService.onBoardUserLeft((data) => {
      console.log('👋 Usuario se fue');
   });

   // Escuchar actualizaciones de usuarios en el workspace
   socketService.onBoardUsersUpdated((data) => {
      console.log('👥 Usuarios del workspace actualizados:', data.users?.length || 0);
   });
};

onMounted(async () => {
   // Cargar usuario del localStorage si existe
   userStore.loadFromStorage();
   console.log('🔄 User loaded from storage:', userStore.currentUser);

   // Si hay usuario guardado, reconectar automáticamente
   if (userStore.currentUser) {
      try {
         console.log('🔄 Reconectando socket...');
         await socketService.connect();

         // Configurar todos los listeners
         setupSocketListeners();

         // Unirse nuevamente con el nombre guardado
         socketService.joinWithName(userStore.currentUser.name);
         console.log('✅ Reconexión exitosa');
      } catch (error) {
         console.error('❌ Error al reconectar:', error);
      }
   }
});

const handleLoginSuccess = () => {
   console.log('✅ Usuario identificado correctamente');
};
</script>
