<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import Input from '@libraries/components/Input.vue';
import { useUserStore } from '../../../stores/userStore';
import { useBoardStore } from '../../../stores/boardStore';
import { socketService } from '../../../services/socketService';

const userStore = useUserStore();
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

const joinBoard = (boardId: string) => {
   socketService.joinBoard(boardId);
};

onMounted(() => {
   boardStore.setLoading(true);
   socketService.requestBoardList();

   socketService.onBoardCreated((data) => {
      boardStore.addBoard(data);
   });

   socketService.onBoardList((data) => {
      boardStore.setBoards(data.boards || []);
      boardStore.setLoading(false);
   });
});
</script>

<template>
   <div class="w-full h-full flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
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
      </div>
   </div>
</template>
