<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Icon } from '@iconify/vue';

interface Props {
   noteId: string | null;
   title: string;
   description: string;
   isOpen: boolean;
}

const props = withDefaults(defineProps<Props>(), {
   title: '',
   description: '',
});

const emit = defineEmits(['save', 'close', 'delete']);

const editTitle = ref<string>('');
const editDescription = ref<string>('');

// Sincronizar los valores cuando se abra el modal
watch(
   () => props.isOpen,
   (newValue) => {
      if (newValue) {
         editTitle.value = props.title;
         editDescription.value = props.description;
      }
   }
);

const canSave = computed(() => editTitle.value.trim().length > 0);

const saveChanges = () => {
   if (!canSave.value) return;

   emit('save', {
      noteId: props.noteId,
      title: editTitle.value.trim(),
      description: editDescription.value.trim(),
   });

   closeModal();
};

const closeModal = () => {
   editTitle.value = '';
   editDescription.value = '';
   emit('close');
};

const deleteNote = () => {
   if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      emit('delete', props.noteId);
      closeModal();
   }
};

const handleKeyDown = (e: KeyboardEvent) => {
   if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      saveChanges();
   }
};
</script>

<template>
   <transition name="fade">
      <div
         v-if="isOpen"
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
         <!-- Modal -->
         <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <!-- Header -->
            <div
               class="flex items-center justify-between p-6 border-b border-neutral-200 bg-gradient-to-r from-blue-50 to-indigo-50"
            >
               <h2 class="text-lg font-bold text-neutral-900">Editar Nota</h2>
               <button @click="closeModal" class="p-2 hover:bg-neutral-200 rounded-lg transition">
                  <Icon icon="lineicons:close" class="w-5 h-5 text-neutral-600" />
               </button>
            </div>

            <!-- Content -->
            <div class="p-6 space-y-4">
               <!-- Título -->
               <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-2">📝 Título</label>
                  <input
                     v-model="editTitle"
                     @keydown="handleKeyDown"
                     type="text"
                     placeholder="Título de la nota..."
                     class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                     autofocus
                  />
                  <p class="text-xs text-neutral-500 mt-1">{{ editTitle.length }}/100 caracteres</p>
               </div>

               <!-- Descripción -->
               <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-2">📄 Descripción</label>
                  <textarea
                     v-model="editDescription"
                     @keydown="handleKeyDown"
                     placeholder="Descripción de la nota..."
                     rows="6"
                     class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition resize-none"
                  />
                  <p class="text-xs text-neutral-500 mt-1">{{ editDescription.length }}/500 caracteres</p>
               </div>

               <!-- Instrucciones -->
               <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  <p class="font-medium mb-1">💡 Consejos:</p>
                  <ul class="list-disc list-inside space-y-1">
                     <li>Usa Ctrl+Enter para guardar rápidamente</li>
                     <li>Click derecho en nota para eliminar</li>
                     <li>Los cambios se sincronizarán automáticamente</li>
                  </ul>
               </div>
            </div>

            <!-- Footer -->
            <div class="flex gap-2 p-6 border-t border-neutral-200 bg-neutral-50">
               <button
                  @click="deleteNote"
                  class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
               >
                  <Icon icon="lineicons:trash-2" class="w-4 h-4" />
                  Eliminar
               </button>
               <div class="flex-1"></div>
               <button
                  @click="closeModal"
                  class="px-4 py-2 bg-neutral-300 text-neutral-900 rounded-lg hover:bg-neutral-400 transition"
               >
                  Cancelar
               </button>
               <button
                  @click="saveChanges"
                  :disabled="!canSave"
                  class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition flex items-center gap-2"
               >
                  <Icon icon="lineicons:checkmark" class="w-4 h-4" />
                  Guardar
               </button>
            </div>
         </div>
      </div>
   </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
   transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
   opacity: 0;
}
</style>
