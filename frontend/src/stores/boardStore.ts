import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface BoardUser {
    socketId: string;
    name: string;
    role: 'editor' | 'viewer';
}

export interface Board {
    id: string;
    name: string;
    description: string;
    creatorId: string;
    creatorName: string;
    users: BoardUser[];
    createdAt: Date;
}

export const useBoardStore = defineStore('board', () => {
    const boards = ref<Board[]>([]);
    const currentBoard = ref<Board | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const isInBoard = computed(() => currentBoard.value !== null);

    /**
     * Rol del usuario actual en el tablero
     * (Se obtiene del socket ID)
     */
    const currentUserRole = computed(() => {
        if (!currentBoard.value) return null;
        // Se determina por userStore cuando entra al tablero
        return currentBoard.value.users[0]?.role || null;
    });

    /**
     * ¿Usuario puede editar tablero actual?
     */
    const canEdit = computed(() => currentUserRole.value === 'editor');

    /**
     * ¿Usuario es el creador?
     */
    const isCreator = computed(() => {
        if (!currentBoard.value) return false;
        return currentBoard.value.creatorId === 'current-socket-id';
    });

    const boardUsers = computed(() => {
        return currentBoard.value?.users || [];
    });

    const boardCount = computed(() => boards.value.length);

    const setBoards = (newBoards: Board[]) => {
        // Forzar reactividad con nueva referencia
        boards.value = newBoards.map(board => ({
            ...board,
            users: [...(board.users || [])]
        }));
        console.log('📋 Boards actualizados:', boards.value.length);
    };

    const addBoard = (board: Board) => {
        const exists = boards.value.find(b => b.id === board.id);
        if (!exists) {
            boards.value.push(board);
        }
    };

    const setCurrentBoard = (board: Board | null) => {
        currentBoard.value = board;
    };

    const updateCurrentBoard = (updates: Partial<Board>) => {
        if (currentBoard.value) {
            currentBoard.value = {
                ...currentBoard.value,
                ...updates
            };
        }
    };

    const addUserToCurrentBoard = (user: BoardUser) => {
        if (currentBoard.value) {
            const exists = currentBoard.value.users.find(u => u.socketId === user.socketId);
            if (!exists) {
                currentBoard.value.users.push(user);
            }
        }
    };

    const removeUserFromCurrentBoard = (socketId: string) => {
        if (currentBoard.value) {
            currentBoard.value.users = currentBoard.value.users.filter(
                u => u.socketId !== socketId
            );
        }
    };

    const setLoading = (loading: boolean) => {
        isLoading.value = loading;
    };

    const setError = (msg: string | null) => {
        error.value = msg;
    };

    const reset = () => {
        currentBoard.value = null;
        error.value = null;
        isLoading.value = false;
    };

    const clear = () => {
        boards.value = [];
        currentBoard.value = null;
        error.value = null;
        isLoading.value = false;
    };

    // ============ RETURN ============

    return {
        // State
        boards,
        currentBoard,
        isLoading,
        error,

        // Computed
        isInBoard,
        currentUserRole,
        canEdit,
        isCreator,
        boardUsers,
        boardCount,

        // Mutations
        setBoards,
        addBoard,
        setCurrentBoard,
        updateCurrentBoard,
        addUserToCurrentBoard,
        removeUserFromCurrentBoard,
        setLoading,
        setError,
        reset,
        clear
    };
});
