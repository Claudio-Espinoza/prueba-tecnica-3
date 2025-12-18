/**
 * Servicio para rastrear qué usuarios están en cada board
 * Se mantiene en memoria durante la sesión del servidor
 */

interface BoardUser {
    socketId: string;
    name: string;
    role: 'editor' | 'viewer';
}

class BoardUsersService {
    private boardUsers: Map<string, BoardUser[]> = new Map();

    /**
     * Agregar un usuario a un board
     */
    addUserToBoard(boardId: string, user: BoardUser): void {
        if (!this.boardUsers.has(boardId)) {
            this.boardUsers.set(boardId, []);
        }
        
        const users = this.boardUsers.get(boardId)!;
        const exists = users.some(u => u.socketId === user.socketId);
        
        if (!exists) {
            users.push(user);
            console.log(`✅ Usuario ${user.name} agregado a board ${boardId}. Total: ${users.length}`);
        }
    }

    /**
     * Remover un usuario de un board
     */
    removeUserFromBoard(boardId: string, socketId: string): void {
        const users = this.boardUsers.get(boardId);
        if (users) {
            const index = users.findIndex(u => u.socketId === socketId);
            if (index !== -1) {
                const userName = users[index].name;
                users.splice(index, 1);
                console.log(`👋 Usuario ${userName} removido de board ${boardId}. Total: ${users.length}`);
                
                // Si no hay más usuarios, eliminar el board del map
                if (users.length === 0) {
                    this.boardUsers.delete(boardId);
                }
            }
        }
    }

    /**
     * Obtener usuarios de un board
     */
    getUsersInBoard(boardId: string): BoardUser[] {
        return this.boardUsers.get(boardId) || [];
    }

    /**
     * Remover un usuario de todos los boards
     */
    removeUserFromAllBoards(socketId: string): void {
        for (const [boardId, users] of this.boardUsers.entries()) {
            const index = users.findIndex(u => u.socketId === socketId);
            if (index !== -1) {
                users.splice(index, 1);
                console.log(`👋 Usuario removido de board ${boardId} (desconexión). Total: ${users.length}`);
                
                if (users.length === 0) {
                    this.boardUsers.delete(boardId);
                }
            }
        }
    }

    /**
     * Obtener información de todos los boards con sus usuarios
     */
    getAllBoardsWithUsers(boards: any[]): any[] {
        return boards.map(board => ({
            ...board,
            users: this.getUsersInBoard(board.id)
        }));
    }

    /**
     * Limpiar estado (útil para testing)
     */
    clear(): void {
        this.boardUsers.clear();
    }
}

export const boardUsersService = new BoardUsersService();
