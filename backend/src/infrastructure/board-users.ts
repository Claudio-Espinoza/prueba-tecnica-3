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
        console.log(`🔍 addUserToBoard llamado: boardId=${boardId}, user=${user.name}, socketId=${user.socketId}`);
        
        if (!this.boardUsers.has(boardId)) {
            console.log(`  → Creando primera entrada para board ${boardId}`);
            this.boardUsers.set(boardId, []);
        }
        
        const users = this.boardUsers.get(boardId)!;
        const exists = users.some(u => u.socketId === user.socketId);
        
        if (exists) {
            console.log(`  ⚠️ Usuario ${user.name} ya existe en board ${boardId}`);
            return;
        }
        
        users.push(user);
        console.log(`✅ Usuario ${user.name} agregado a board ${boardId}. Total en board: ${users.length}`);
        console.log(`   Map state: ${this.boardUsers.size} boards totales`);
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
        const users = this.boardUsers.get(boardId) || [];
        console.log(`🔍 getUsersInBoard(${boardId}): ${users.length} usuarios`, users.map(u => u.name));
        return users;
    }

    /**
     * Actualizar rol de un usuario en un board
     */
    updateUserRole(boardId: string, socketId: string, newRole: 'editor' | 'viewer'): boolean {
        const users = this.boardUsers.get(boardId);
        if (users) {
            const user = users.find(u => u.socketId === socketId);
            if (user) {
                user.role = newRole;
                console.log(`🔄 Rol actualizado para ${user.name} a ${newRole} en board ${boardId}`);
                return true;
            }
        }
        return false;
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
        console.log(`🔍 getAllBoardsWithUsers: procesando ${boards.length} boards`);
        console.log(`   Map total: ${this.boardUsers.size} entries`);
        
        const result = boards.map(board => {
            const users = this.getUsersInBoard(board.id);
            console.log(`   Board "${board.name}" (${board.id}): ${users.length} usuarios`);
            return {
                ...board,
                users: users
            };
        });
        
        return result;
    }

    /**
     * Limpiar estado (útil para testing)
     */
    clear(): void {
        this.boardUsers.clear();
    }
}

export const boardUsersService = new BoardUsersService();
