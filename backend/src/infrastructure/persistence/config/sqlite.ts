import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../../../data/collaboration.db');

let db: sqlite3.Database;

export function getDatabase(): sqlite3.Database {
    if (!db) {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
            } else {
                console.log('SQLite database connected:', dbPath);
            }
        });
        db.configure('busyTimeout', 5000);
    }
    return db;
}

export function runAsync(query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
        getDatabase().run(query, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

export function getAsync(query: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
        getDatabase().get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

export function allAsync(query: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
        getDatabase().all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

export async function initializeDatabase(): Promise<void> {
    try {
        console.log('[DB Init] Initializing SQLite database...');

        await runAsync(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                socket_id TEXT UNIQUE NOT NULL,
                connected_at TEXT NOT NULL
            )
        `);
        console.log('[DB Init] Users table created');

        await runAsync(`
            CREATE TABLE IF NOT EXISTS boards (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                owner_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(owner_id) REFERENCES users(id)
            )
        `);
        console.log('[DB Init] Boards table created');

        await runAsync(`
            CREATE TABLE IF NOT EXISTS user_board_roles (
                user_id TEXT NOT NULL,
                board_id TEXT NOT NULL,
                role TEXT CHECK (role IN ('viewer', 'editor')) DEFAULT 'viewer',
                PRIMARY KEY (user_id, board_id),
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(board_id) REFERENCES boards(id)
            )
        `);
        console.log('[DB Init] User board roles table created');

        await runAsync(`
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                board_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                x REAL NOT NULL DEFAULT 0,
                y REAL NOT NULL DEFAULT 0,
                updated_by TEXT,
                version INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(board_id) REFERENCES boards(id)
            )
        `);
        console.log('[DB Init] Notes table created');

        await runAsync(`
            CREATE TABLE IF NOT EXISTS comments (
                id TEXT PRIMARY KEY,
                note_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                text TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(note_id) REFERENCES notes(id)
            )
        `);
        console.log('[DB Init] Comments table created');

        await seedDatabase();
        console.log('[DB Init] SQLite database initialized successfully');
    } catch (err: any) {
        console.error('[DB Init] Error initializing database:', err.message);
        throw err;
    }
}

async function seedDatabase(): Promise<void> {
    const userCount = await getAsync('SELECT COUNT(*) as count FROM users');
    if (userCount.count > 0) {
        console.log('[DB Seed] Database already populated');
        return;
    }

    console.log('[DB Seed] Populating database with sample data...');

    const userId1 = 'user-001';
    const userId2 = 'user-002';
    const boardId1 = 'board-001';
    const boardId2 = 'board-002';

    const now = new Date().toISOString();

    await runAsync(
        `INSERT INTO users (id, name, socket_id, connected_at) VALUES (?, ?, ?, ?)`,
        [userId1, 'Alice', 'socket-alice-123', now]
    );
    console.log('[DB Seed] User 1 created: Alice');

    await runAsync(
        `INSERT INTO users (id, name, socket_id, connected_at) VALUES (?, ?, ?, ?)`,
        [userId2, 'Bob', 'socket-bob-456', now]
    );
    console.log('[DB Seed] User 2 created: Bob');

    await runAsync(
        `INSERT INTO boards (id, name, description, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [boardId1, 'Proyecto Web', 'Desarrollo de sitio web', userId1, now, now]
    );
    console.log('[DB Seed] Board 1 created: Proyecto Web');

    await runAsync(
        `INSERT INTO boards (id, name, description, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [boardId2, 'Móvil App', 'App para iOS y Android', userId2, now, now]
    );
    console.log('[DB Seed] Board 2 created: Móvil App');

    await runAsync(
        `INSERT INTO user_board_roles (user_id, board_id, role) VALUES (?, ?, ?)`,
        [userId1, boardId1, 'editor']
    );
    await runAsync(
        `INSERT INTO user_board_roles (user_id, board_id, role) VALUES (?, ?, ?)`,
        [userId2, boardId1, 'viewer']
    );
    await runAsync(
        `INSERT INTO user_board_roles (user_id, board_id, role) VALUES (?, ?, ?)`,
        [userId2, boardId2, 'editor']
    );
    console.log('[DB Seed] User board roles created');

    const noteId1 = 'note-001';
    const noteId2 = 'note-002';

    await runAsync(
        `INSERT INTO notes (id, board_id, title, content, x, y, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [noteId1, boardId1, 'Diseño UI', 'Crear mockups en Figma', 100, 100, userId1, now, now]
    );
    console.log('[DB Seed] Note 1 created: Diseño UI');

    await runAsync(
        `INSERT INTO notes (id, board_id, title, content, x, y, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [noteId2, boardId1, 'Backend API', 'Endpoints REST implementados', 300, 150, userId1, now, now]
    );
    console.log('[DB Seed] Note 2 created: Backend API');

    await runAsync(
        `INSERT INTO comments (id, note_id, user_name, text, created_at) VALUES (?, ?, ?, ?, ?)`,
        ['comment-001', noteId1, 'Alice', 'Necesitamos un diseño moderno', now]
    );
    console.log('[DB Seed] Comment created');

    console.log('[DB Seed] ✅ Database seeded with sample data');
}

export async function closeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) reject(err);
                else {
                    console.log('✅ SQLite database closed');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}
