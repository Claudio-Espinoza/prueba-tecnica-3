<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useUserStore } from '../../../stores/userStore';

interface Comment {
   id: string;
   userId: string;
   userName: string;
   text: string;
   createdAt: string;
}

interface Props {
   noteId: string | null;
   noteName?: string;
   comments: Comment[];
   isOpen: boolean;
}

const props = withDefaults(defineProps<Props>(), {
   noteName: 'Sin título',
});

const emit = defineEmits(['add-comment', 'close']);
const userStore = useUserStore();

const newCommentText = ref<string>('');
const isSubmitting = ref<boolean>(false);

const commentInputFocused = ref<boolean>(false);

// Formatear fecha para mostrar cuando fue creado el comentario
const formatDate = (dateString: string): string => {
   try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins}m`;
      if (diffHours < 24) return `Hace ${diffHours}h`;
      if (diffDays < 7) return `Hace ${diffDays}d`;

      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
   } catch {
      return 'Fecha desconocida';
   }
};

// Agregar comentario
const submitComment = async () => {
   if (!newCommentText.value.trim()) return;

   isSubmitting.value = true;

   const newComment: Comment = {
      id: Date.now().toString(),
      userId: userStore.currentUser?.id || 'unknown',
      userName: userStore.currentUser?.name || 'Anónimo',
      text: newCommentText.value.trim(),
      createdAt: new Date().toISOString(),
   };

   emit('add-comment', {
      noteId: props.noteId,
      comment: newComment,
   });

   newCommentText.value = '';
   isSubmitting.value = false;
};

// Cerrar modal
const closeModal = () => {
   newCommentText.value = '';
   emit('close');
};

// Permitir enviar con Ctrl+Enter
const handleKeyDown = (e: KeyboardEvent) => {
   if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      submitComment();
   }
};

const noComments = computed(() => !props.comments || props.comments.length === 0);
</script>

<template>
   <!-- Overlay del modal -->
   <transition name="fade">
      <div
         v-if="isOpen"
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
         <!-- Modal -->
         <div
            class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
         >
            <!-- Header -->
            <div
               class="flex items-center justify-between p-6 border-b border-neutral-200 bg-gradient-to-r from-blue-50 to-indigo-50"
            >
               <div>
                  <h2 class="text-lg font-bold text-neutral-900">Comentarios</h2>
                  <p class="text-sm text-neutral-600 mt-1">{{ noteName }}</p>
               </div>
               <button @click="closeModal" class="p-2 hover:bg-neutral-200 rounded-lg transition">
                  <Icon icon="lineicons:close" class="w-5 h-5 text-neutral-600" />
               </button>
            </div>

            <!-- Comments List -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
               <div v-if="noComments" class="text-center py-12 text-neutral-500">
                  <Icon icon="lineicons:chat-3-line" class="w-12 h-12 mx-auto opacity-30 mb-2" />
                  <p class="text-sm">Sin comentarios aún</p>
                  <p class="text-xs text-neutral-400 mt-1">Sé el primero en comentar</p>
               </div>

               <div v-for="comment in comments" :key="comment.id" class="flex gap-3">
                  <!-- Avatar -->
                  <div
                     class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"
                  >
                     <span class="text-xs font-bold text-blue-600">
                        {{ comment.userName.charAt(0).toUpperCase() }}
                     </span>
                  </div>

                  <!-- Comment content -->
                  <div class="flex-1 bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                     <div class="flex items-center justify-between gap-2 mb-1">
                        <p class="font-medium text-sm text-neutral-900">{{ comment.userName }}</p>
                        <p class="text-xs text-neutral-500">{{ formatDate(comment.createdAt) }}</p>
                     </div>
                     <p class="text-sm text-neutral-700 leading-relaxed">{{ comment.text }}</p>
                  </div>
               </div>
            </div>

            <!-- Input area -->
            <div class="border-t border-neutral-200 p-4 bg-neutral-50">
               <div class="flex gap-2">
                  <input
                     v-model="newCommentText"
                     @keydown="handleKeyDown"
                     @focus="commentInputFocused = true"
                     @blur="commentInputFocused = false"
                     type="text"
                     placeholder="Escribe un comentario... (Ctrl+Enter para enviar)"
                     class="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  />
                  <button
                     @click="submitComment"
                     :disabled="!newCommentText.trim() || isSubmitting"
                     class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                  >
                     <Icon icon="lineicons:send" class="w-4 h-4" />
                  </button>
               </div>
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
