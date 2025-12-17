import { state } from "./data.js";
import { createNote, createComment } from "./utils.js";

export default function socketHandlers(io, socket) {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // --- 1. Registrar usuario ---
    socket.on("user:join", ({ name }) => {
        state.users[socket.id] = { name };
        io.emit("presence:users", { users: Object.values(state.users) });
    });

    // --- 2. Inicializar tablero ---
    socket.on("board:init", () => {
        socket.emit("board:data", { notes: state.notes });
    });

    // --- 3. Crear nota ---
    socket.on("note:create", (data) => {
        try {
            const note = createNote({
                ...data, user:
                    state.users[socket.id]?.name || "unknown"
            });
            state.notes.push(note);
            io.emit("note:created", note);
        } catch (err) {
            socket.emit("server:error", { message: "Error creando la nota." });
        }
    });

    // --- 4. Actualizar nota ---
    socket.on("note:update", (note) => {
        try {
            const i = state.notes.findIndex((n) => n.id === note.id);
            if (i !== -1) {
                state.notes[i] = {
                    ...state.notes[i], ...note, updatedBy:
                        state.users[socket.id]?.name
                };
                io.emit("note:updated", state.notes[i]);
            }
        } catch (err) {
            socket.emit("server:error", { message: "Error actualizando la nota." });
        }
    });

    // --- 5. Eliminar nota ---
    socket.on("note:delete", ({ id }) => {
        try {
            state.notes = state.notes.filter((n) => n.id !== id);
            io.emit("note:deleted", { id });
        } catch (err) {
            socket.emit("server:error", {
                message: "Error eliminando la nota."
            });
        }
    });

    // --- 6. Agregar comentario ---
    socket.on("note:comment", ({ noteId, text }) => {
        try {
            const note = state.notes.find((n) => n.id === noteId);
            if (note) {
                const comment = createComment({
                    user: state.users[socket.id]?.name || "unknown",

                    text
                });
                note.comments.push(comment);
                io.emit("note:commented", { noteId, comment });
            }
        } catch (err) {
            socket.emit("server:error", { message: "Error agregando comentario." });
        }
    });
    
    // --- 7. Manejar desconexión ---
    socket.on("disconnect", () => {
        delete state.users[socket.id];
        io.emit("presence:users", { users: Object.values(state.users) });
        console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
}