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
const debugInfo = ref<string>('Inicializando...');

const currentBoard = computed(() => boardStore.currentBoard);
const isCreator = computed(() => {
   if (!currentBoard.value || !userStore.currentUser) return false;
   return currentBoard.value.creatorName === userStore.currentUser.name;
});

// Recuperar board del localStorage si existe
const loadBoardFromStorage = () => {
   try {
      const stored = localStorage.getItem('currentBoard');
      if (stored) {
         const board = JSON.parse(stored);
         boardStore.setCurrentBoard(board);
         console.log('🔄 Board restaurado desde localStorage:', board);
         return board;
      }
   } catch (e) {
      console.error('Error loading board from storage:', e);
   }
   return null;
};

// Guardar board en localStorage
const saveBoardToStorage = (board: any) => {
   try {
      localStorage.setItem('currentBoard', JSON.stringify(board));
      console.log('💾 Board guardado en localStorage');
   } catch (e) {
      console.error('Error saving board to storage:', e);
   }
};

const participantColor = (index: number) => {
   const colors = ['bg-yellow-400', 'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'];
   return colors[index % colors.length];
};

const toggleUserRole = (user: any) => {
   if (!isCreator.value) return;

   console.log('🔄 Toggling role para:', user.name);
   const newRole = user.role === 'editor' ? 'viewer' : 'editor';

   socketService.socket?.emit('user:update-role', {
      boardId: currentBoard.value?.id,
      userId: user.socketId,
      newRole: newRole,
   });

   user.role = newRole;
};

const goBack = () => {
   socketService.socket?.emit('board:leave', { boardId: currentBoard.value?.id });
   boardStore.setCurrentBoard(null);
   localStorage.removeItem('currentBoard');
   console.log('🗑️ Board removido de localStorage');
   router.back();
};

// DEFINIR LISTENERS PRIMERO (fuera de onMounted para que se registren inmediatamente)
let listenersSetup = false;
const setupRealtimeListeners = () => {
   if (listenersSetup) {
      console.log('⚠️ Listeners ya configurados');
      return;
   }
   listenersSetup = true;
   console.log('🎯 Registrando listeners de tiempo real');

   socketService.socket?.on('board:users-updated', (data) => {
      console.log('🔄 board:users-updated recibido:', data);
      console.log('📍 Board IDs: actual=', currentBoard.value?.id, 'received=', data.boardId);

      // Actualizar si el board ID coincide con el actual
      if (data.boardId === currentBoard.value?.id && data.users && Array.isArray(data.users)) {
         console.log('🔄 Usuarios actualizados para este board:', data.users.length, 'usuarios');
         boardUsers.value = [...data.users];
         activeUsersCount.value = data.users.length;
         debugInfo.value = `✅ Actualizado | ${activeUsersCount.value} usuarios`;
         console.log('✅ Contador actualizado a:', activeUsersCount.value);
      } else if (!currentBoard.value?.id) {
         console.log('⚠️ Sin board actual asignado aún');
      } else if (data.boardId !== currentBoard.value.id) {
         console.log('ℹ️ Evento de otro board (', data.boardId, '!==', currentBoard.value.id, ')');
      }
   });

   socketService.socket?.on('board:user-joined', (data) => {
      console.log('👤 board:user-joined recibido:', data);
      console.log(
         '👤 Verificación: boardId=',
         data.boardId,
         ', currentBoard=',
         currentBoard.value?.id
      );
      if (!data.boardId || !currentBoard.value?.id) {
         console.warn('⚠️ IDs no disponibles, almacenando evento');
         return;
      }
      if (data.boardId === currentBoard.value.id) {
         console.log('👤 Usuario se unió:', data.user.name);
         const userExists = boardUsers.value.some((u) => u.socketId === data.user.socketId);
         if (!userExists) {
            boardUsers.value = [...boardUsers.value, data.user];
            activeUsersCount.value = boardUsers.value.length;
            debugInfo.value = `👤 Usuario unido | Total: ${activeUsersCount.value}`;
            console.log('✅ Usuario agregado. Total:', boardUsers.value.length);
         }
      } else {
         console.log('ℹ️ Evento de otro board:', data.boardId);
      }
   });

   socketService.socket?.on('board:user-left', (data) => {
      console.log('👋 board:user-left recibido:', data);
      if (data.boardId === currentBoard.value?.id) {
         console.log('👋 Usuario se fue');
         boardUsers.value = boardUsers.value.filter((u) => u.socketId !== data.userId);
         activeUsersCount.value = boardUsers.value.length;
         debugInfo.value = `👋 Usuario salió | Total: ${activeUsersCount.value}`;
         console.log('✅ Usuario removido. Total:', boardUsers.value.length);
      }
   });

   socketService.socket?.on('board:data', (data) => {
      console.log('📊 Datos del board recibido:', data);
      console.log('📊 Board object:', data?.board);
      console.log('📊 Board ID:', data?.board?.id);
      console.log('📊 Board users property exists:', 'users' in (data?.board || {}));
      console.log('📊 Board users array:', data?.board?.users);
      console.log('📊 Users length:', data?.board?.users?.length);

      if (data?.board) {
         // Actualizar el board en el store Y en localStorage
         boardStore.setCurrentBoard(data.board);
         saveBoardToStorage(data.board);

         console.log(
            '📊 Verificación: data.board.users es array?',
            Array.isArray(data.board.users)
         );

         if (data.board.users && Array.isArray(data.board.users) && data.board.users.length > 0) {
            console.log('📊 Usuarios en el board:', data.board.users.length, 'usuarios');
            console.log('📊 Detalles de usuarios:', data.board.users);
            boardUsers.value = [...data.board.users];
            activeUsersCount.value = data.board.users.length;
            debugInfo.value = `✅ Cargado | Usuarios: ${activeUsersCount.value}`;
            console.log('✅ Usuarios actualizados desde board:data:', activeUsersCount.value);
         } else {
            console.warn('⚠️ No hay usuarios en board:data o array vacío');
            console.warn(
               '⚠️ Condición: users=',
               data.board.users,
               'isArray=',
               Array.isArray(data.board.users),
               'length=',
               data.board.users?.length
            );
            boardUsers.value = [];
            activeUsersCount.value = 0;
            debugInfo.value = '⚠️ Sin usuarios en datos';
         }
      }
   });

   socketService.socket?.on('user:role-updated', (data) => {
      console.log('🔄 Rol actualizado:', data);
      const user = boardUsers.value.find((u) => u.socketId === data.userId);
      if (user) {
         user.role = data.role;
         debugInfo.value = `🔄 Rol actualizado: ${user.name} → ${data.role}`;
         console.log(`✅ Rol de ${user.name} actualizado a ${data.role}`);
      }
   });
};

// Inicializar listeners inmediatamente a nivel de setup
setupRealtimeListeners();

// Watch para actualizar cuando cambia el board
watch(
   () => currentBoard.value,
   (newBoard) => {
      console.log('👀 Watch: currentBoard cambió:', newBoard);
      if (!newBoard) {
         boardUsers.value = [];
         activeUsersCount.value = 0;
      }
   },
   { immediate: false }
);

onMounted(() => {
   console.log('🚀 WorkplaceView montado');

   // Si no hay board en el store, intentar recuperar del localStorage
   if (!currentBoard.value) {
      console.log('⚠️ No hay board en store, intentando recuperar del localStorage');
      const restoredBoard = loadBoardFromStorage();
      if (restoredBoard) {
         console.log('✅ Board restaurado:', restoredBoard);
         boardStore.setCurrentBoard(restoredBoard);
         // Re-unirse al board via socket si fue restaurado
         socketService.joinBoard(restoredBoard.id);
      }
   } else {
      console.log('✅ Board ya existe en store:', currentBoard.value);
      saveBoardToStorage(currentBoard.value);
      // Pedir datos actualizados del board (usuarios, notas, etc)
      console.log('📍 Pidiendo datos del board:', currentBoard.value.id);
      socketService.socket?.emit('board:init', { boardId: currentBoard.value.id });
   }

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
});

// Cleanup listeners cuando se unmount
onUnmounted(() => {
   console.log('🛑 WorkplaceView desmontado');
   socketService.socket?.off('board:users-updated');
   socketService.socket?.off('board:user-joined');
   socketService.socket?.off('board:user-left');
   socketService.socket?.off('board:data');
   socketService.socket?.off('user:role-updated');
});
</script>

<template>
   <div class="size-full flex flex-col">
      <article class="flex-1 flex flex-row gap-6 pb-8 pt-4 overflow-hidden">
         <section
            class="flex-1 p-6 bg-neutral-50 border rounded-2xl border-neutral-400 flex flex-col gap-6 overflow-hidden"
         >
            <canvas
               ref="canvasRef"
               class="size-full rounded-l cursor-crosshair border-2 border-dashed border-neutral-400"
            />
         </section>
         <section
            class="h-full w-80 p-6 bg-neutral-50 border rounded-2xl border-neutral-400 flex flex-col gap-2 overflow-hidden"
         >
            <div class="flex flex-col gap-4 pb-4 border-b border-neutral-200">
               <button
                  @click="goBack()"
                  class="flex flex-row cursor-pointer py-2 px-2 w-full bg-neutral-300 items-center justify-center rounded-lg gap-2 items-center hover:bg-red-100 hover:text-red-900 active:scale-95 transition-all"
               >
                  <Icon icon="lineicons:exit" class="w-5 h-5" />
                  <span class="text-sm font-medium">Salir</span>
               </button>
               <div>
                  <h2 class="text-xl font-bold text-neutral-900 mb-2 truncate">
                     Titulo: {{ currentBoard?.name || 'Espacio sin nombre' }}
                  </h2>
                  <p class="text-sm text-neutral-700 line-clamp-2">
                     Descrición: {{ currentBoard?.description || 'Sin descripción' }}
                  </p>
                  <p class="text-xs text-neutral-700 mt-2">
                     Se pueden visualizar todos los participantes activos en este espacio de trabajo
                  </p>
               </div>
            </div>

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

            <!-- Debug Info -->
            <div class="text-xs bg-blue-100 p-2 rounded text-blue-900">
               <p>{{ debugInfo }}</p>
               <p>Usuarios cargados: {{ boardUsers.length }}</p>
            </div>

            <!-- Lista de participantes -->
            <div class="flex-1 overflow-y-auto space-y-2">
               <div v-if="boardUsers.length === 0" class="text-center py-8 text-neutral-500">
                  <p>Sin participantes ({{ activeUsersCount }})</p>
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
                  <!-- Solo el creador puede cambiar roles -->
                  <button
                     v-if="isCreator"
                     @click="toggleUserRole(user)"
                     class="ml-2 px-3 py-1 text-sm font-medium rounded-lg border border-neutral-300 hover:bg-neutral-100 transition flex-shrink-0 cursor-pointer"
                  >
                     {{ user.role === 'editor' ? '👁️ A Visualizar' : '✏️ A Editor' }}
                  </button>
                  <!-- Otros usuarios no pueden cambiar roles -->
                  <span
                     v-else
                     class="ml-2 px-3 py-1 text-sm font-medium text-neutral-600 rounded-lg border border-neutral-300 bg-neutral-50"
                  >
                     {{ user.role === 'editor' ? 'Editor' : 'Visualizador' }}
                  </span>
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
