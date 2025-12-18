import {
    getDatabase,
    initializeDatabase,
    closeDatabase,
    runAsync,
    getAsync,
    allAsync
} from './src/infrastructure/persistence/config/sqlite.js';

async function testDatabase() {
    try {
        console.log('Inicializando base de datos...');
        await initializeDatabase();
        console.log('Base de datos inicializada\n');

        console.log('Insertando usuario de prueba...');
        const userId = `user-test-${Date.now()}`;
        const now = new Date().toISOString();

        await runAsync(
            'INSERT INTO users (id, name, socket_id, connected_at) VALUES (?, ?, ?, ?)',
            [userId, 'Test User', `socket-test-${Date.now()}`, now]
        );
        console.log(`Usuario creado: ${userId}\n`);

        console.log('Consultando usuario insertado...');
        const user = await getAsync(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );
        console.log('Usuario encontrado:');
        console.log(JSON.stringify(user, null, 2));
        console.log();

        console.log('Listando todos los usuarios...');
        const allUsers = await allAsync('SELECT * FROM users ORDER BY connected_at DESC LIMIT 5');
        console.log(`Total de usuarios (últimos 5):`);
        allUsers.forEach((u, index) => {
            console.log(`  ${index + 1}. ${u.name} (${u.id})`);
        });
        console.log();

        console.log('Listando todos los boards...');
        const allBoards = await allAsync('SELECT * FROM boards ORDER BY created_at DESC');
        console.log(`Total de boards: ${allBoards.length}`);
        allBoards.forEach((board, index) => {
            console.log(`  ${index + 1}. ${board.name} - "${board.description}"`);
        });
        console.log();

        console.log('Listando todas las notas...');
        const allNotes = await allAsync('SELECT * FROM notes ORDER BY created_at DESC');
        console.log(`Total de notas: ${allNotes.length}`);
        allNotes.forEach((note, index) => {
            console.log(`  ${index + 1}. ${note.title} - "${note.content}"`);
        });
        console.log();

        console.log('Listando todos los comentarios...');
        const allComments = await allAsync('SELECT * FROM comments ORDER BY created_at DESC');
        console.log(`Total de comentarios: ${allComments.length}`);
        allComments.forEach((comment, index) => {
            console.log(`  ${index + 1}. "${comment.text}" - por ${comment.user_name}`);
        });
        console.log();

        console.log('Estadísticas de la base de datos:');
        const userCount = await getAsync('SELECT COUNT(*) as count FROM users');
        const boardCount = await getAsync('SELECT COUNT(*) as count FROM boards');
        const noteCount = await getAsync('SELECT COUNT(*) as count FROM notes');
        const commentCount = await getAsync('SELECT COUNT(*) as count FROM comments');

        console.log(`  Usuarios: ${userCount.count}`);
        console.log(`  Boards: ${boardCount.count}`);
        console.log(`  Notas: ${noteCount.count}`);
        console.log(`  Comentarios: ${commentCount.count}`);
        console.log();

        console.log('Boards con sus usuarios y roles:');
        const boardsWithUsers = await allAsync(`
            SELECT 
                b.id,
                b.name,
                COUNT(DISTINCT ubr.user_id) as user_count,
                GROUP_CONCAT(DISTINCT u.name || ' (' || ubr.role || ')') as users
            FROM boards b
            LEFT JOIN user_board_roles ubr ON b.id = ubr.board_id
            LEFT JOIN users u ON ubr.user_id = u.id
            GROUP BY b.id
        `);

        boardsWithUsers.forEach((board, index) => {
            console.log(`  ${index + 1}. ${board.name}`);
            console.log(`     Usuarios (${board.user_count}): ${board.users || 'ninguno'}`);
        });
        console.log();

        console.log('Prueba completada exitosamente!');
        console.log('La base de datos está funcionando correctamente');

    } catch (error: any) {
        console.error('Error durante la prueba:', error.message);
        console.error(error);
    } finally {
        await closeDatabase();
        console.log('Conexión cerrada');
        process.exit(0);
    }
}

testDatabase();
