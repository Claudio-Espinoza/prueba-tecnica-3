<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useBoardStore } from '../../../stores/boardStore';
import { useUserStore } from '../../../stores/userStore';
import { socketService } from '../../../services/socketService';
import { konvaService } from '../../../services/konvaService';
import KonvaNote from '../components/KonvaNote.vue';
import NoteCommentsModal from '../components/NoteCommentsModal.vue';
import NoteEditModal from '../components/NoteEditModal.vue';

const router = useRouter();
const boardStore = useBoardStore();
const userStore = useUserStore();

const stageRef = ref<any>(null);
const layerRef = ref<any>(null);
const activeUsersCount = ref<number>(0);
const boardUsers = ref<any[]>([]);
const debugInfo = ref<string>('Inicializando...');
const participantListKey = ref<number>(0); // Key para forzar re-render de la lista

// Estado de notas para FASE 3: Canvas Manager
const notes = ref<any[]>([
   {
      id: '1',
      title: 'Bienvenida',
      description: 'Esta es una nota de ejemplo en el canvas colaborativo',
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      color: '#FF6B6B',
      comments: [],
   },
   {
      id: '2',
      title: 'Instrucciones',
      description: 'Arrastra las notas, haz doble clic para comentar',
      x: 300,
      y: 100,
      width: 200,
      height: 150,
      color: '#4ECDC4',
      comments: [],
   },
]);
const selectedNoteId = ref<string | null>(null);
const noteColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA15E'];

// Estado del modal de comentarios (FASE 4)
const showCommentsModal = ref<boolean>(false);
const selectedNoteForComments = ref<any>(null);

// Estado del modal de edición
const showEditModal = ref<boolean>(false);
const selectedNoteForEdit = ref<any>(null);

// Función para generar un checksum simple de la lista
const getListChecksum = (users: any[]): string => {
   return JSON.stringify(users.map((u) => `${u.socketId}-${u.role}`)).length.toString();
};

let lastChecksum = '';
let checkInterval: ReturnType<typeof setInterval> | null = null;

const currentBoard = computed(() => boardStore.currentBoard);
const isCreator = computed(() => {
   if (!currentBoard.value || !userStore.currentUser) return false;
   return currentBoard.value.creatorName === userStore.currentUser.name;
});

// Config del stage de Konva
const stageConfig = computed(() => ({
   width: typeof window !== 'undefined' ? window.innerWidth - 340 : 1000,
   height: typeof window !== 'undefined' ? window.innerHeight - 100 : 600,
}));

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

// Canvas Manager: Crear nueva nota
const createNote = () => {
   const newNote = {
      id: Date.now().toString(),
      title: 'Nueva Nota',
      description: 'Haz clic para editar...',
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 200,
      height: 150,
      color: noteColors[Math.floor(Math.random() * noteColors.length)],
      comments: [],
   };
   notes.value.push(newNote);
   console.log('✅ Nota creada:', newNote.id);
   // Emitir al socket para sincronizar con otros usuarios
   socketService.socket?.emit('notes:create', {
      boardId: currentBoard.value?.id,
      note: newNote,
   });
};

// Debounce para actualizaciones de posición (evitar spam)
let positionUpdateTimeout: any = null;
const positionUpdates = new Map<string, { x: number; y: number }>();

// Canvas Manager: Actualizar posición de nota (drag-drop)
const updateNotePosition = (noteId: string, x: number, y: number) => {
   const note = notes.value.find((n) => n.id === noteId);
   if (note) {
      note.x = x;
      note.y = y;

      // Almacenar la última actualización
      positionUpdates.set(noteId, { x, y });

      // Limpiar timeout anterior
      if (positionUpdateTimeout) clearTimeout(positionUpdateTimeout);

      // Emitir con debounce muy corto (100ms)
      positionUpdateTimeout = setTimeout(() => {
         for (const [id, pos] of positionUpdates.entries()) {
            socketService.socket?.emit('notes:update-position', {
               boardId: currentBoard.value?.id,
               noteId: id,
               x: pos.x,
               y: pos.y,
            });
            console.log(`📡 Posición sincronizada: Nota ${id} → (${pos.x}, ${pos.y})`);
         }
         positionUpdates.clear();
      }, 100);
   }
};

// Canvas Manager: Seleccionar nota y abrir editor
const selectNote = (noteId: string) => {
   const note = notes.value.find((n) => n.id === noteId);
   if (note) {
      selectedNoteForEdit.value = note;
      showEditModal.value = true;
      selectedNoteId.value = noteId;
      console.log('🎯 Nota seleccionada para editar:', noteId);
   }
};

// Canvas Manager: Eliminar nota
const deleteNote = (noteId: string) => {
   notes.value = notes.value.filter((n) => n.id !== noteId);
   if (selectedNoteId.value === noteId) selectedNoteId.value = null;
   console.log('🗑️ Nota eliminada:', noteId);
   // Emitir al socket
   socketService.socket?.emit('notes:delete', {
      boardId: currentBoard.value?.id,
      noteId,
   });
};

// Canvas Manager: Agregar comentario a nota
const addCommentToNote = (noteId: string) => {
   console.log('💬 Abrir modal de comentarios para nota:', noteId);
   const note = notes.value.find((n) => n.id === noteId);
   if (note) {
      selectedNoteForComments.value = note;
      showCommentsModal.value = true;
   }
};

// Modal: Agregar comentario
const handleAddComment = async (data: any) => {
   const note = notes.value.find((n) => n.id === data.noteId);
   if (note) {
      if (!note.comments) note.comments = [];
      note.comments.push(data.comment);
      await nextTick();
      console.log(`✅ Comentario agregado: ${data.noteId}`);
      // Emitir al socket inmediatamente
      socketService.socket?.emit('notes:comment-add', {
         boardId: currentBoard.value?.id,
         noteId: data.noteId,
         comment: data.comment,
      });
   }
};

// Modal: Cerrar
const closeCommentsModal = () => {
   showCommentsModal.value = false;
   selectedNoteForComments.value = null;
};

// Modal: Guardar cambios de edición
const handleSaveEdit = (data: any) => {
   const note = notes.value.find((n) => n.id === data.noteId);
   if (note) {
      note.title = data.title;
      note.description = data.description;
      console.log(`✅ Nota editada: ${data.noteId}`);
      // Emitir al socket para sincronizar
      socketService.socket?.emit('notes:update', {
         boardId: currentBoard.value?.id,
         noteId: data.noteId,
         title: data.title,
         description: data.description,
      });
   }
   closeEditModal();
};

// Modal: Eliminar nota desde el modal de edición
const handleDeleteFromModal = (noteId: string) => {
   deleteNote(noteId);
   closeEditModal();
};

// Modal: Cerrar editor
const closeEditModal = () => {
   showEditModal.value = false;
   selectedNoteForEdit.value = null;
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

   socketService.socket?.on('board:users-updated', async (data) => {
      if (data.boardId === currentBoard.value?.id && data.users && Array.isArray(data.users)) {
         boardUsers.value = [...data.users];
         activeUsersCount.value = data.users.length;
         debugInfo.value = `✅ ${activeUsersCount.value} usuarios en línea`;
         await nextTick();
      }
   });

   socketService.socket?.on('board:user-joined', async (data) => {
      if (data.boardId === currentBoard.value?.id) {
         const userExists = boardUsers.value.some((u) => u.socketId === data.user.socketId);
         if (!userExists) {
            boardUsers.value = [...boardUsers.value, data.user];
            activeUsersCount.value = boardUsers.value.length;
            debugInfo.value = `👤 ${data.user.name} se unió`;
            await nextTick();
         }
      }
   });

   socketService.socket?.on('board:user-left', async (data) => {
      if (data.boardId === currentBoard.value?.id) {
         boardUsers.value = boardUsers.value.filter((u) => u.socketId !== data.userId);
         activeUsersCount.value = boardUsers.value.length;
         debugInfo.value = `👋 Usuario salió | Total: ${activeUsersCount.value}`;
         await nextTick();
      }
   });

   socketService.socket?.on('board:data', (data) => {
      console.log('📊 Datos del board recibido:', data);
      console.log('📊 Board object:', data?.board);
      console.log('📊 Board ID:', data?.board?.id);
      console.log('📊 Board users property exists:', 'users' in (data?.board || {}));
      console.log('📊 Board users array:', data?.board?.users);
      console.log('📊 Users length:', data?.board?.users?.length);
      console.log('📝 Notas recibidas:', data?.notes);

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

      // 📝 Cargar notas iniciales del board (FASE 6: Sincronización)
      if (data?.notes && Array.isArray(data.notes)) {
         console.log(`📝 Cargando ${data.notes.length} notas iniciales del board`);
         // Mapear las notas de BD a formato del canvas
         notes.value = data.notes.map((note: any) => ({
            id: note.id || note.getId?.(),
            title: note.title,
            description: note.content || note.description || '',
            x: note.x || 50,
            y: note.y || 50,
            width: note.width || 200,
            height: note.height || 150,
            color: note.color || '#FF6B6B',
            comments: note.comments || [],
         }));
         console.log(`✅ Notas sincronizadas: ${notes.value.length} notas cargadas`);
      } else if (!data?.notes) {
         console.log('ℹ️ Sin notas en el board');
         // Mantener las notas de ejemplo si no hay notas en BD
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

   // 📝 Listeners para eventos de notas (FASE 5: Backend Sync) - Tiempo Real
   socketService.socket?.on('notes:created', async (data) => {
      console.log('📝 [INMEDIATO] Nota creada por otro usuario:', data.note.id);
      if (data.boardId === currentBoard.value?.id) {
         notes.value.push(data.note);
         await nextTick();
         console.log(`✅ [SYNC] Nota creada: ${data.note.title}`);
      }
   });

   socketService.socket?.on('notes:updated', async (data) => {
      console.log('🔄 [INMEDIATO] Nota actualizada:', data.noteId);
      if (data.boardId === currentBoard.value?.id) {
         const note = notes.value.find((n) => n.id === data.noteId);
         if (note) {
            // Actualizar los campos que enviamos
            if (data.updates) {
               if (data.updates.title !== undefined) note.title = data.updates.title;
               if (data.updates.description !== undefined)
                  note.description = data.updates.description;
               if (data.updates.x !== undefined) note.x = data.updates.x;
               if (data.updates.y !== undefined) note.y = data.updates.y;
            }
            await nextTick();
            console.log(`✅ [SYNC] Nota actualizada: ${data.noteId}`);
         }
      }
   });

   socketService.socket?.on('notes:position-updated', async (data) => {
      console.log('📍 [INMEDIATO] Posición actualizada:', data.noteId);
      if (data.boardId === currentBoard.value?.id) {
         const note = notes.value.find((n) => n.id === data.noteId);
         if (note) {
            note.x = data.x;
            note.y = data.y;
            await nextTick();
            console.log(`✅ [SYNC] Posición: (${data.x}, ${data.y})`);
         }
      }
   });

   socketService.socket?.on('notes:deleted', async (data) => {
      console.log('🗑️ [INMEDIATO] Nota eliminada:', data.noteId);
      if (data.boardId === currentBoard.value?.id) {
         notes.value = notes.value.filter((n) => n.id !== data.noteId);
         if (selectedNoteId.value === data.noteId) selectedNoteId.value = null;
         await nextTick();
         console.log(`✅ [SYNC] Nota eliminada: ${data.noteId}`);
      }
   });

   socketService.socket?.on('notes:comment-added', async (data) => {
      console.log('💬 [INMEDIATO] Comentario agregado:', data.noteId);
      if (data.boardId === currentBoard.value?.id) {
         const note = notes.value.find((n) => n.id === data.noteId);
         if (note) {
            if (!note.comments) note.comments = [];
            note.comments.push(data.comment);
            await nextTick();
            console.log(`✅ [SYNC] Comentario sincronizado: ${data.noteId}`);
         }
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

   // 🔄 Monitoreo continuo cada 300ms para detectar cambios en la lista de participantes
   lastChecksum = getListChecksum(boardUsers.value);
   checkInterval = setInterval(() => {
      const currentChecksum = getListChecksum(boardUsers.value);
      if (currentChecksum !== lastChecksum) {
         console.log('🔄 Cambio detectado en la lista de participantes. Re-renderizando...');
         lastChecksum = currentChecksum;
         // Cambiar la key para forzar re-render del componente
         participantListKey.value++;
      }
   }, 300);

   // Inicializar Konva después de que los refs estén montados
   if (stageRef.value && layerRef.value) {
      console.log('🎨 Stage de Konva inicializado:', stageRef.value);
      // Inicializar el servicio con los refs
      konvaService.initStage(stageRef.value, layerRef.value);
      // Configurar zoom y pan
      konvaService.setupZoom();
      konvaService.setupPan();
      console.log('✅ Zoom y pan configurados');
   }
});

// Cleanup listeners cuando se unmount
onUnmounted(() => {
   console.log('🛑 WorkplaceView desmontado');

   // Limpiar el intervalo del cron
   if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
      console.log('⏹️ Cron de verificación detenido');
   }

   // Limpiar Konva
   konvaService.destroy();
   console.log('🗑️ Konva limpiado');

   socketService.socket?.off('board:users-updated');
   socketService.socket?.off('board:user-joined');
   socketService.socket?.off('board:user-left');
   socketService.socket?.off('board:data');
   socketService.socket?.off('user:role-updated');
   socketService.socket?.off('notes:created');
   socketService.socket?.off('notes:updated');
   socketService.socket?.off('notes:position-updated');
   socketService.socket?.off('notes:deleted');
   socketService.socket?.off('notes:comment-added');
});
</script>

<template>
   <div class="size-full flex flex-col">
      <article class="flex-1 flex flex-row gap-6 pb-8 pt-4 overflow-hidden">
         <section
            class="flex-1 p-6 bg-neutral-50 border rounded-2xl border-neutral-400 flex flex-col gap-6 overflow-hidden"
         >
            <!-- Konva Stage -->
            <div class="flex-1 flex flex-col gap-2">
               <button
                  @click="createNote()"
                  class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2 w-fit"
               >
                  <Icon icon="lineicons:plus" class="w-4 h-4" />
                  Nueva Nota
               </button>
               <v-stage
                  ref="stageRef"
                  :config="stageConfig"
                  class="rounded-l border-2 border-dashed border-neutral-400 flex-1"
               >
                  <v-layer ref="layerRef">
                     <KonvaNote
                        v-for="note in notes"
                        :key="note.id"
                        :note="note"
                        :isSelected="selectedNoteId === note.id"
                        :color="note.color"
                        @select="(id) => selectNote(id)"
                        @update="(data) => updateNotePosition(data.id, data.x, data.y)"
                        @delete="(id) => deleteNote(id)"
                        @comment="(id) => addCommentToNote(id)"
                     />
                  </v-layer>
               </v-stage>
            </div>
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
            <div :key="participantListKey" class="flex-1 overflow-y-auto space-y-2">
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

      <!-- Modal de Comentarios (FASE 4) -->
      <NoteCommentsModal
         :noteId="selectedNoteForComments?.id || null"
         :noteName="selectedNoteForComments?.title"
         :comments="selectedNoteForComments?.comments || []"
         :isOpen="showCommentsModal"
         @add-comment="handleAddComment"
         @close="closeCommentsModal"
      />

      <!-- Modal de Edición de Nota -->
      <NoteEditModal
         :noteId="selectedNoteForEdit?.id || null"
         :title="selectedNoteForEdit?.title || ''"
         :description="selectedNoteForEdit?.description || ''"
         :isOpen="showEditModal"
         @save="handleSaveEdit"
         @delete="handleDeleteFromModal"
         @close="closeEditModal"
      />
   </div>
</template>
