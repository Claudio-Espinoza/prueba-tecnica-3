export const SOCKET_EVENTS = {
    // Board Events
    BOARD_CREATE: 'board:create',
    BOARD_JOIN: 'board:join',
    BOARD_INIT: 'board:init',
    BOARD_DATA: 'board:data',
    BOARD_USERS: 'board:users',
    BOARD_LIST: 'board:list',
    BOARD_CREATED: 'board:created',
    BOARD_LEAVE: 'board:leave',
    BOARD_USER_JOINED: 'board:user-joined',
    BOARD_USER_LEFT: 'board:user-left',
    BOARD_USERS_UPDATED: 'board:users-updated',

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
    USER_UPDATE_ROLE: 'user:update-role',
    USER_ROLE_UPDATED: 'user:role-updated',

    // Error Events
    SERVER_ERROR: 'server:error'
} as const;