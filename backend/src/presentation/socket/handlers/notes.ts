import { Socket } from 'socket.io';
import { io as ioServer, Server } from 'socket.io';

/**
 * Handlers para eventos de notas colaborativas
 * Gestiona creación, actualización, eliminación y comentarios de notas en tiempo real
 */
export const setupNotesHandlers = (socket: Socket, io: Server) => {
   /**
    * Crear una nueva nota en el board
    */
   socket.on('notes:create', (data) => {
      console.log('📝 notes:create recibido:', data);

      if (!data.boardId) {
         console.error('❌ boardId no especificado');
         return;
      }

      // Verificar que el usuario sea editor del board
      const userRole = socket.data.userRole;
      if (userRole !== 'editor' && userRole !== 'owner') {
         console.warn('⚠️ Usuario no tiene permisos para crear notas');
         socket.emit('error', { message: 'No tienes permisos para crear notas' });
         return;
      }

      // Enriquecer la nota con información del usuario
      const enrichedNote = {
         ...data.note,
         createdBy: socket.data.userId,
         createdByName: socket.data.userName,
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
      };

      // TODO: Guardar en BD (Service)
      console.log('✅ Nota creada por', socket.data.userName, ':', enrichedNote.id);

      // Broadcast a todos los usuarios en el board
      io.to(data.boardId).emit('notes:created', {
         boardId: data.boardId,
         note: enrichedNote,
         userId: socket.data.userId,
         userName: socket.data.userName,
      });
   });

   /**
    * Actualizar posición de una nota (drag-drop)
    */
   socket.on('notes:update-position', (data) => {
      console.log('📍 notes:update-position recibido:', data);

      if (!data.boardId || !data.noteId) {
         console.error('❌ Datos incompletos');
         return;
      }

      // TODO: Actualizar en BD
      console.log(
         `✅ Nota ${data.noteId} movida a (${data.x}, ${data.y}) por ${socket.data.userName}`
      );

      // Broadcast a todos en el board (excepto al que envió)
      socket.to(data.boardId).emit('notes:position-updated', {
         boardId: data.boardId,
         noteId: data.noteId,
         x: data.x,
         y: data.y,
         userId: socket.data.userId,
      });
   });

   /**
    * Eliminar una nota
    */
   socket.on('notes:delete', (data) => {
      console.log('🗑️ notes:delete recibido:', data);

      if (!data.boardId || !data.noteId) {
         console.error('❌ Datos incompletos');
         return;
      }

      // Verificar permisos (solo creador o editor del board)
      const userRole = socket.data.userRole;
      if (userRole !== 'editor' && userRole !== 'owner') {
         console.warn('⚠️ Usuario no tiene permisos para eliminar notas');
         socket.emit('error', { message: 'No tienes permisos para eliminar notas' });
         return;
      }

      // TODO: Eliminar de BD
      console.log(`✅ Nota ${data.noteId} eliminada por ${socket.data.userName}`);

      // Broadcast a todos en el board
      io.to(data.boardId).emit('notes:deleted', {
         boardId: data.boardId,
         noteId: data.noteId,
         userId: socket.data.userId,
      });
   });

   /**
    * Agregar comentario a una nota
    */
   socket.on('notes:comment-add', (data) => {
      console.log('💬 notes:comment-add recibido:', data);

      if (!data.boardId || !data.noteId) {
         console.error('❌ Datos incompletos');
         return;
      }

      const enrichedComment = {
         ...data.comment,
         userId: socket.data.userId,
         userName: socket.data.userName,
         createdAt: new Date().toISOString(),
      };

      // TODO: Guardar comentario en BD
      console.log(`✅ Comentario agregado a nota ${data.noteId} por ${socket.data.userName}`);

      // Broadcast a todos en el board
      io.to(data.boardId).emit('notes:comment-added', {
         boardId: data.boardId,
         noteId: data.noteId,
         comment: enrichedComment,
         userId: socket.data.userId,
      });
   });

   /**
    * Suscribirse a cambios de una nota específica (para colaboración en tiempo real)
    */
   socket.on('notes:subscribe', (data) => {
      console.log('🔔 Usuario suscrito a cambios de nota:', data.noteId);

      // Crear un room específico para cada nota
      const noteRoom = `note:${data.noteId}`;
      socket.join(noteRoom);

      console.log(`✅ Socket unido a room ${noteRoom}`);
   });

   /**
    * Desuscribirse de cambios de una nota
    */
   socket.on('notes:unsubscribe', (data) => {
      console.log('🔔 Usuario desuscrito de nota:', data.noteId);

      const noteRoom = `note:${data.noteId}`;
      socket.leave(noteRoom);

      console.log(`✅ Socket dejó room ${noteRoom}`);
   });
};
