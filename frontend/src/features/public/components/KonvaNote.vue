<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
   note: any;
   isSelected: boolean;
   color: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['select', 'update', 'delete', 'comment']);

const editTitle = ref(false);

const groupConfig = computed(() => ({
   x: props.note.x,
   y: props.note.y,
   draggable: true,
   opacity: props.isSelected ? 1 : 0.8,
}));

const rectConfig = computed(() => ({
   width: props.note.width || 200,
   height: props.note.height || 150,
   fill: props.color,
   stroke: props.isSelected ? '#000' : 'transparent',
   strokeWidth: props.isSelected ? 3 : 1,
   cornerRadius: 8,
   shadowColor: '#000',
   shadowBlur: props.isSelected ? 10 : 0,
   shadowOpacity: props.isSelected ? 0.3 : 0,
   shadowOffset: { x: 0, y: 0 },
}));

const titleConfig = computed(() => ({
   x: 10,
   y: 10,
   text: props.note.title || 'Untitled',
   fontSize: 16,
   fontStyle: 'bold',
   fill: '#fff',
   width: (props.note.width || 200) - 20,
   ellipsis: true,
}));

const descConfig = computed(() => ({
   x: 10,
   y: 40,
   text: props.note.description || 'No description',
   fontSize: 12,
   fill: 'rgba(255, 255, 255, 0.9)',
   width: (props.note.width || 200) - 20,
   height: (props.note.height || 150) - 60,
   wrap: 'word',
}));

const badgeConfig = computed(() => ({
   x: (props.note.width || 200) - 50,
   y: (props.note.height || 150) - 25,
   text: `💬 ${props.note.comments?.length || 0}`,
   fontSize: 11,
   fill: '#fff',
   background: 'rgba(0, 0, 0, 0.3)',
   padding: [4, 8],
   cornerRadius: 4,
}));

const selectNote = () => emit('select', props.note.id);
const openComments = () => emit('comment', props.note.id);
const deleteNoteHandler = (e: any) => {
   e.evt?.preventDefault?.();
   emit('delete', props.note.id);
};
</script>

<template>
   <v-group
      :config="groupConfig"
      @click="selectNote"
      @dblclick="openComments"
      @contextmenu="deleteNoteHandler"
      @dragend="(e: any) => emit('update', { id: note.id, x: e.target.x(), y: e.target.y() })"
   >
      <!-- Rectángulo de fondo -->
      <v-rect :config="rectConfig" />

      <!-- Título -->
      <v-text :config="titleConfig" />

      <!-- Descripción -->
      <v-text :config="descConfig" />

      <!-- Badge de comentarios -->
      <v-label v-if="note.comments && note.comments.length > 0" :config="badgeConfig">
         <v-tag :config="{ fill: 'rgba(0, 0, 0, 0.3)', cornerRadius: 4 }" />
         <v-text
            :config="{
               text: `💬 ${note.comments.length}`,
               fontSize: 11,
               fill: '#fff',
               padding: [4, 8],
            }"
         />
      </v-label>
   </v-group>
</template>
