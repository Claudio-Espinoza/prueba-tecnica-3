<template>
   <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
         <!-- Header -->
         <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Tablero Colaborativo</h1>
            <p class="text-gray-600">Identifícate para comenzar</p>
         </div>

         <!-- Form -->
         <form @submit.prevent="handleLogin" class="space-y-6">
            <!-- Input Nombre -->
            <div>
               <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                  Tu nombre
               </label>
               <input
                  id="name"
                  v-model="name"
                  type="text"
                  placeholder="Ingresa tu nombre"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  @keyup.enter="handleLogin"
                  :disabled="isLoading"
                  autofocus
               />
               <p v-if="error" class="text-red-500 text-sm mt-2">
                  {{ error }}
               </p>
            </div>

            <!-- Estado de carga -->
            <div v-if="isLoading" class="flex items-center justify-center py-2">
               <div class="inline-flex items-center space-x-2">
                  <div class="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div class="h-2 w-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div class="h-2 w-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
               </div>
            </div>

            <!-- Botón -->
            <button
               type="submit"
               class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
               :disabled="isLoading || !name.trim()"
            >
               {{ isLoading ? 'Conectando...' : 'Entrar' }}
            </button>
         </form>

         <!-- Información -->
         <div class="mt-8 pt-6 border-t border-gray-200">
            <p class="text-xs text-gray-500 text-center">
               Sin necesidad de contraseña, solo tu nombre
            </p>
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '../stores/userStore';
import { socketService } from '../services/socketService';

const name = ref('');
const isLoading = ref(false);
const error = ref('');

const userStore = useUserStore();

const handleLogin = async () => {
   error.value = '';

   if (!name.value.trim()) {
      error.value = 'Por favor ingresa tu nombre';
      return;
   }

   if (name.value.trim().length < 2) {
      error.value = 'El nombre debe tener al menos 2 caracteres';
      return;
   }

   isLoading.value = true;

   try {
      // Conectar a Socket.IO
      await socketService.connect();
      console.log('✅ Socket connected successfully');

      // Configurar listeners ANTES de emitir
      let userJoinedReceived = false;
      let presenceUsersReceived = false;

      socketService.onUserJoined((data) => {
         console.log('✅ User joined event received:', data);
         userStore.setCurrentUser({
            socketId: data.socketId,
            name: data.name,
         });
         userJoinedReceived = true;
         checkAndEmit();
      });

      socketService.onPresenceUsers((data) => {
         console.log('👥 Online users event received:', data.users);
         userStore.setOnlineUsers(data.users);
         presenceUsersReceived = true;
         checkAndEmit();
      });

      // Función para verificar si ambos eventos se recibieron
      const checkAndEmit = () => {
         if (userJoinedReceived && presenceUsersReceived) {
            console.log('✅ All events received, login complete');
            isLoading.value = false;
            emit('login-success');
         }
      };

      // Emitir evento de identificación
      console.log(`📍 Emitting user:join with name: ${name.value}`);
      socketService.joinWithName(name.value);

      // Timeout de seguridad por si los eventos no llegan
      setTimeout(() => {
         if (isLoading.value) {
            console.warn('⚠️ Timeout: Login took too long');
            if (userStore.currentUser) {
               console.log('✅ But user was set, proceeding');
               isLoading.value = false;
               emit('login-success');
            } else {
               error.value = 'La conexión tardó demasiado. Intenta de nuevo.';
               isLoading.value = false;
               socketService.disconnect();
            }
         }
      }, 5000);
   } catch (err: any) {
      console.error('❌ Login error:', err);
      error.value = 'Error de conexión. Intenta de nuevo.';
      isLoading.value = false;
      socketService.disconnect();
   }
};

const emit = defineEmits<{
   'login-success': [];
}>();
</script>

<style scoped>
.delay-100 {
   animation-delay: 0.1s;
}

.delay-200 {
   animation-delay: 0.2s;
}

@keyframes bounce {
   0%,
   100% {
      transform: translateY(0);
   }
   50% {
      transform: translateY(-6px);
   }
}

.animate-bounce {
   animation: bounce 1.4s infinite;
}
</style>
