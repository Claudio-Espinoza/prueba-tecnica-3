<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useBoardStore } from '../../../stores/boardStore';
import { useUserStore } from '../../../stores/userStore';
import { socketService } from '../../../services/socketService';

const router = useRouter();
const boardStore = useBoardStore();
const userStore = useUserStore();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const activeUsersCount = ref<number>(0);
const boardUsers = ref<any[]>([]);

const currentBoard = computed(() => boardStore.currentBoard);
const isCreator = computed(() => {
   if (!currentBoard.value || !userStore.currentUser) return false;
   return currentBoard.value.creatorName === userStore.currentUser.name;
});

const participantColor = (index: number) => {
   const colors = ['bg-yellow-400', 'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'];
   return colors[index % colors.length];
};

const goBack = () => {
   socketService.socket?.emit('board:leave', { boardId: currentBoard.value?.id });
   boardStore.setCurrentBoard(null);
   router.back();
};

// Watch para actualizar usuarios cuando cambia el board
watch(
   () => currentBoard.value,
   (newBoard) => {
      if (newBoard?.users) {
         boardUsers.value = newBoard.users;
         activeUsersCount.value = newBoard.users.length;
         console.log('👥 Board actualizado con usuarios:', newBoard.users);
      }
   },
   { immediate: true }
);

// Listeners para actualizaciones en tiempo real
const setupRealtimeListeners = () => {
   // Escuchar actualizaciones de usuarios en el workspace
   socketService.socket?.on('board:users-updated', (data) => {
      console.log('🔄 board:users-updated recibido:', data);
      if (data.boardId === currentBoard.value?.id) {
         console.log('🔄 Usuarios actualizados en el workspace:', data.users);
         // Forzar reactividad con nueva referencia
         boardUsers.value = [...data.users];
         activeUsersCount.value = data.users.length;
         console.log('✅ Contador actualizado a:', activeUsersCount.value);
      }
   });

   // Escuchar cuando alguien se une
   socketService.socket?.on('board:user-joined', (data) => {
      console.log('👤 board:user-joined recibido:', data);
      if (data.boardId === currentBoard.value?.id) {
         console.log('👤 Usuario se unió:', data.user.name);
         const userExists = boardUsers.value.some((u) => u.socketId === data.user.socketId);
         if (!userExists) {
            boardUsers.value = [...boardUsers.value, data.user];
            activeUsersCount.value = boardUsers.value.length;
            console.log('✅ Usuario agregado. Total:', boardUsers.value.length);
         }
      }
   });

   // Escuchar cuando alguien se va
   socketService.socket?.on('board:user-left', (data) => {
      console.log('👋 board:user-left recibido:', data);
      if (data.boardId === currentBoard.value?.id) {
         console.log('👋 Usuario se fue');
         boardUsers.value = boardUsers.value.filter((u) => u.socketId !== data.userId);
         activeUsersCount.value = boardUsers.value.length;
         console.log('✅ Usuario removido. Total:', boardUsers.value.length);
      }
   });

   // Escuchar cuando se carga el board
   socketService.socket?.on('board:data', (data) => {
      if (currentBoard.value?.id === data.board?.id) {
         console.log('📊 Datos del board cargados:', data.board);
         if (data.board?.users && data.board.users.length > 0) {
            console.log('📊 Usuarios en el board:', data.board.users);
            boardUsers.value = [...data.board.users];
            activeUsersCount.value = data.board.users.length;
            console.log('✅ Usuarios actualizados desde board:data:', activeUsersCount.value);
         }
      }
   });
};

onMounted(() => {
   console.log('🚀 WorkplaceView montado');

   // Inicializar canvas
   if (canvasRef.value) {
      const ctx = canvasRef.value.getContext('2d');
      if (ctx) {
         canvasRef.value.width = canvasRef.value.offsetWidth;
         canvasRef.value.height = canvasRef.value.offsetHeight;
         ctx.fillStyle = '#fafafa';
         ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
      }
   }

   // Setup listeners para actualizaciones en tiempo real
   setupRealtimeListeners();

   // Inicializar usuarios desde el board actual
   if (currentBoard.value?.users) {
      boardUsers.value = currentBoard.value.users;
      activeUsersCount.value = currentBoard.value.users.length;
      console.log('👥 Usuarios inicializados:', currentBoard.value.users);
   }
});

// Cleanup listeners cuando se unmount
onUnmounted(() => {
   console.log('🛑 WorkplaceView desmontado');
   socketService.socket?.off('board:users-updated');
   socketService.socket?.off('board:user-joined');
   socketService.socket?.off('board:user-left');
   socketService.socket?.off('board:data');
});
</script>

<template>
   <div class="size-full flex flex-col">
      <article class="flex-1 flex flex-row gap-6 pb-8 pt-4 overflow-hidden">
         <section
            class="flex-1 p-6 bg-neutral-50 border rounded-2xl border-neutral-400 flex flex-col gap-6 overflow-hidden"
         >
            <!-- Header con título del workspace -->
            <div class="flex flex-col gap-4 pb-4 border-b border-neutral-300">
               <div class="flex items-center justify-between">
                  <div class="flex-1">
                     <h1 class="text-3xl font-bold text-neutral-900 mb-1">
                        {{ currentBoard?.name || 'Espacio sin nombre' }}
                     </h1>
                     <p class="text-sm text-neutral-600">
                        {{ currentBoard?.description || 'Sin descripción' }}
                     </p>
                  </div>
                  <button
                     @click="goBack()"
                     class="flex flex-row cursor-pointer py-2 px-4 rounded-lg gap-2 items-center hover:bg-red-100 hover:text-red-900 active:scale-95 transition-all"
                  >
                     <Icon icon="lineicons:exit" class="w-5 h-5" />
                     <span class="text-sm font-medium">Salir</span>
                  </button>
               </div>
            </div>

            <canvas
               ref="canvasRef"
               class="size-full rounded-l cursor-crosshair border-2 border-dashed border-neutral-400"
            />
         </section>
         <section
            class="h-full w-80 p-6 bg-neutral-50 border rounded-2xl border-neutral-400 flex flex-col gap-6 overflow-hidden"
         >
            <div class="flex flex-col gap-4 pb-4 border-b border-neutral-200">
               <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p class="text-xs font-medium text-green-600">ESPACIO ACTIVO</p>
               </div>
               <div>
                  <h2 class="text-xl font-bold text-neutral-900 mb-2 truncate">
                     {{ currentBoard?.name || 'Espacio sin nombre' }}
                  </h2>
                  <p class="text-sm text-neutral-600 line-clamp-2">
                     {{ currentBoard?.description || 'Sin descripción' }}
                  </p>
               </div>
               <div class="flex items-center gap-2 text-xs">
                  <Icon icon="material-symbols:people" class="w-4 h-4 text-neutral-600" />
                  <span class="text-neutral-600">
                     {{ activeUsersCount }} usuario{{ activeUsersCount !== 1 ? 's' : '' }} activo{{
                        activeUsersCount !== 1 ? 's' : ''
                     }}
                  </span>
               </div>
            </div>

            <div>
               <p class="text-xs font-medium text-neutral-500 mb-2">PARTICIPANTES</p>
               <p class="text-xs text-neutral-600">
                  Se pueden visualizar todos los participantes activos en este espacio de trabajo
               </p>
            </div>

            <!-- Leyenda de colores -->
            <div class="flex items-center gap-4 text-xs border-t border-b border-neutral-200 py-3">
               <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span>Capacidad de editor</span>
               </div>
               <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>Capacidad de visualizar</span>
               </div>
            </div>

            <!-- Lista de participantes -->
            <div class="flex-1 overflow-y-auto space-y-2">
               <div v-if="boardUsers.length === 0" class="text-center py-8 text-neutral-500">
                  <p>Sin participantes</p>
               </div>
               <div
                  v-for="(user, index) in boardUsers"
                  :key="user.socketId"
                  class="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200 hover:shadow-sm transition"
               >
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                     <div
                        :class="[
                           'w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0',
                           participantColor(index),
                        ]"
                     >
                        {{ user.name.charAt(0).toUpperCase() }}
                     </div>
                     <div class="min-w-0">
                        <p class="font-medium text-neutral-900 truncate">{{ user.name }}</p>
                        <p class="text-xs text-neutral-500">
                           {{ user.role === 'editor' ? 'Editor' : 'Visualizador' }}
                        </p>
                     </div>
                  </div>
                  <button
                     v-if="isCreator"
                     class="ml-2 px-3 py-1 text-sm font-medium rounded-lg border border-neutral-300 hover:bg-neutral-100 transition flex-shrink-0"
                  >
                     {{ user.role === 'editor' ? 'Editar' : 'Visualizar' }}
                  </button>
                  <button
                     v-else
                     class="ml-2 px-3 py-1 text-sm font-medium text-neutral-600 rounded-lg border border-neutral-300 bg-neutral-50"
                     disabled
                  >
                     {{ user.role === 'editor' ? 'Editar' : 'Visualizar' }}
                  </button>
               </div>
            </div>

            <!-- Info del creador -->
            <div class="border-t border-neutral-200 pt-4">
               <p class="text-xs text-neutral-500 mb-2">Creado por:</p>
               <p class="font-medium text-neutral-900">{{ currentBoard?.creatorName }}</p>
               <p class="text-xs text-neutral-500 mt-2">
                  {{ new Date(currentBoard?.createdAt || '').toLocaleDateString() }}
               </p>
            </div>
         </section>
      </article>
   </div>
</template>
