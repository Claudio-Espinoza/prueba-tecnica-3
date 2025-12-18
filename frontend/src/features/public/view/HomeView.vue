<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import Input from '@libraries/components/Input.vue';
import { useBoardStore } from '../../../stores/boardStore';
import { socketService } from '../../../services/socketService';

const router = useRouter();
const boardStore = useBoardStore();

const boardName = ref('');
const boardDescription = ref('');
const isCreatingBoard = ref(false);

const createBoard = async () => {
   if (!boardName.value.trim()) {
      alert('Ingresa un nombre para el tablero');
      return;
   }

   isCreatingBoard.value = true;
   try {
      socketService.createBoard(boardName.value, boardDescription.value);

      boardName.value = '';
      boardDescription.value = '';
   } catch (error) {
      console.error('Error creating board:', error);
      alert('Error al crear el tablero');
   } finally {
      isCreatingBoard.value = false;
   }
};

const joinBoard = (board: any) => {
   console.log('🚪 Joining board:', board.name);
   boardStore.setCurrentBoard(board);
   socketService.joinBoard(board.id);

   // Navegar a workplace inmediatamente
   // WorkplaceView emitirá board:init cuando se monte para obtener los datos actualizados
   setTimeout(() => {
      console.log('📍 Navegando a /workplace');
      router.push('/workplace');
   }, 100);
};

onMounted(() => {
   console.log('🏠 HomeView montado');
   boardStore.setLoading(true);
   socketService.requestBoardList();

   socketService.onBoardCreated((data) => {
      console.log('📋 Nuevo tablero creado:', data.name);
      boardStore.addBoard(data);
   });

   socketService.onBoardList((data) => {
      console.log('📋 Lista de tableros recibida:', data.boards?.length || 0);
      boardStore.setBoards(data.boards || []);
      boardStore.setLoading(false);
   });

   // Actualizar lista de boards cuando alguien se une a uno
   // Escuchar cuando alguien entra a un board para actualizar contador
   socketService.socket?.on('board:user-joined', () => {
      console.log('👤 Alguien entró a un board, actualizando lista');
      socketService.requestBoardList();
   });

   // Escuchar cuando alguien sale de un board para actualizar contador
   socketService.socket?.on('board:user-left', () => {
      console.log('👋 Alguien salió de un board, actualizando lista');
      socketService.requestBoardList();
   });

   // Watch para forzar reactividad cuando los boards cambian
   watch(
      () => boardStore.boards,
      (newBoards) => {
         console.log('🔄 Boards reactivos cambiaron:', newBoards.length);
      },
      { deep: true }
   );
});
</script>

<template>
   <div class="flex-1 flex flex-row gap-6 pb-8 pt-4 overflow-hidden">
      <div class="w-200 flex flex-col gap-6 overflow-y-auto">
         <div
            class="w-full p-6 bg-blue-100/30 border-2 border-dashed rounded-2xl border-blue-400 flex flex-col gap-2 flex-shrink-0"
         >
            <header class="flex flex-row gap-1 items-center">
               <Icon icon="material-symbols:info" class="w-5 h-5 text-blue-400" />
               <h3 class="text-blue-500 font-medium">Información</h3>
            </header>
            <p class="text-blue-500 font-medium text-sm">
               Se debe considerar que el nombre no puede repetirse, la información no será editable
               una vez creado y el acceso como visitante es libre.
            </p>
         </div>

         <div
            class="w-full p-6 bg-neutral-50 border rounded-2xl border-neutral-400 flex flex-col gap-6 flex-shrink-0"
         >
            <header class="flex gap-2 flex-col">
               <h3 class="text-2xl font-bold">Crear espacio</h3>
               <p class="text-neutral-800 text-sm">
                  Formulario para crear espacios de trabajo con notas y comentarios.
               </p>
            </header>

            <form @submit.prevent="createBoard" class="flex flex-col gap-4">
               <Input
                  v-model="boardName"
                  placeholder="Nombre del espacio"
                  label="Nombre del espacio"
                  type="text"
                  :disabled="isCreatingBoard"
                  icon="mdi:briefcase"
                  :required="true"
                  :min-length="2"
                  :max-length="250"
                  helper-text="El nombre del espacio que usará tu equipo"
               />

               <Input
                  v-model="boardDescription"
                  placeholder="Descripción (opcional)"
                  label="Descripción"
                  type="text"
                  :disabled="isCreatingBoard"
                  icon="mdi:text-box"
                  :max-length="500"
                  helper-text="Breve descripción del propósito"
               />

               <button
                  type="submit"
                  :disabled="isCreatingBoard || !boardName.trim()"
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
               >
                  {{ isCreatingBoard ? 'Creando...' : 'Crear espacio' }}
               </button>
            </form>
         </div>
      </div>

      <div
         class="w-full p-6 bg-neutral-50 border rounded-2xl border-neutral-400 flex flex-col gap-6 overflow-y-auto"
      >
         <h2 class="text-2xl font-bold flex-shrink-0">Espacios disponibles</h2>

         <div v-if="boardStore.isLoading" class="text-center py-8">
            <p class="text-gray-600">Cargando espacios...</p>
         </div>

         <div v-else-if="boardStore.boardCount === 0" class="text-center py-12">
            <p class="text-gray-600">No hay espacios creados aún. ¡Crea uno!</p>
         </div>

         <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
               v-for="board in boardStore.boards"
               :key="board.id"
               class="group p-5 bg-white border-2 border-neutral-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition cursor-pointer overflow-hidden relative"
               @click="joinBoard(board)"
            >
               <!-- Background gradient on hover -->
               <div
                  class="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition"
               ></div>

               <div class="relative z-10">
                  <div class="flex items-start justify-between mb-3">
                     <h3
                        class="text-lg font-bold text-neutral-900 group-hover:text-blue-600 transition"
                     >
                        {{ board.name }}
                     </h3>
                     <Icon
                        icon="mdi:chevron-right"
                        class="w-5 h-5 text-neutral-400 group-hover:text-blue-500 transition transform group-hover:translate-x-1"
                     />
                  </div>

                  <p v-if="board.description" class="text-sm text-neutral-600 mb-4 line-clamp-2">
                     {{ board.description }}
                  </p>

                  <div class="space-y-2">
                     <div class="flex items-center gap-2 text-xs text-neutral-600">
                        <Icon icon="mdi:account" class="w-4 h-4" />
                        <span>{{ board.creatorName }}</span>
                     </div>
                     <div class="flex items-center gap-2 text-xs">
                        <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span class="text-emerald-600 font-medium"
                           >{{ board.users?.length || 0 }} usuario{{
                              board.users?.length !== 1 ? 's' : ''
                           }}</span
                        >
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>
