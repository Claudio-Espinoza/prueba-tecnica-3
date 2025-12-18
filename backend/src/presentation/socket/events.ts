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
    NOTE_CREATE: 'notes:create',
    NOTE_UPDATE: 'notes:update',
    NOTE_UPDATE_POSITION: 'notes:update-position',
    NOTE_DELETE: 'notes:delete',
    NOTE_CREATED: 'notes:created',
    NOTE_UPDATED: 'notes:updated',
    NOTE_POSITION_UPDATED: 'notes:position-updated',
    NOTE_DELETED: 'notes:deleted',

    // Comment Events
    NOTE_COMMENT: 'notes:comment-add',
    NOTE_COMMENTED: 'notes:comment-added',

    // User Events
    USER_JOIN: 'user:join',
    PRESENCE_USERS: 'presence:users',
    USER_UPDATE_ROLE: 'user:update-role',
    USER_ROLE_UPDATED: 'user:role-updated',

    // Error Events
    SERVER_ERROR: 'server:error'
} as const;