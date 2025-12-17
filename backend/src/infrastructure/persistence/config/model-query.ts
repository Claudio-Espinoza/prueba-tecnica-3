export const MIGRATIONS = {
  boards: `
    CREATE TABLE IF NOT EXISTS boards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      owner_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  users: `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      socket_id TEXT UNIQUE NOT NULL,
      connected_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  user_board_roles: `
    CREATE TABLE IF NOT EXISTS user_board_roles (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      role TEXT CHECK (role IN ('viewer', 'editor')) DEFAULT 'viewer',
      PRIMARY KEY (user_id, board_id)
    );
  `,

  notes: `
    CREATE TABLE IF NOT EXISTS notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      x INT NOT NULL,
      y INT NOT NULL,
      updated_by TEXT NOT NULL,
      version INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  comments: `
    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  indexes: `
    CREATE INDEX IF NOT EXISTS notes_board_id_idx ON notes(board_id);
    CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at DESC);
    CREATE INDEX IF NOT EXISTS comments_note_id_idx ON comments(note_id);
    CREATE INDEX IF NOT EXISTS user_board_roles_board_id_idx ON user_board_roles(board_id);
  `
};

export const FULL_SCHEMA = `
  ${MIGRATIONS.boards}
  ${MIGRATIONS.users}
  ${MIGRATIONS.user_board_roles}
  ${MIGRATIONS.notes}
  ${MIGRATIONS.comments}
  ${MIGRATIONS.indexes}
`;