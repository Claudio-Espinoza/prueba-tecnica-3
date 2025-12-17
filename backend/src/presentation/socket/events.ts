export const SOCKET_EVENTS = {
    // Board Events
    BOARD_CREATE: 'board:create',
    BOARD_JOIN: 'board:join',
    BOARD_INIT: 'board:init',
    BOARD_DATA: 'board:data',
    BOARD_USERS: 'board:users',

    // Note Events
    NOTE_CREATE: 'note:create',
    NOTE_UPDATE: 'note:update',
    NOTE_DELETE: 'note:delete',
    NOTE_CREATED: 'note:created',
    NOTE_UPDATED: 'note:updated',
    NOTE_DELETED: 'note:deleted',

    // Comment Events
    NOTE_COMMENT: 'note:comment',
    NOTE_COMMENTED: 'note:commented',

    // User Events
    USER_JOIN: 'user:join',
    PRESENCE_USERS: 'presence:users',

    // Error Events
    SERVER_ERROR: 'server:error'
} as const;