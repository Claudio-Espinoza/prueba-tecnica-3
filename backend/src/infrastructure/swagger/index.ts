import swaggerJsdoc from 'swagger-jsdoc';

const port = process.env.PORT || '3001';
const env = process.env.NODE_ENV || 'development';

const definition = {
    openapi: '3.0.0',
    info: {
        title: 'Prueba Técnica 3 - API',
        version: '1.0.0',
        description: 'API de tableros colaborativos en tiempo real',
        contact: {
            name: 'Soporte',
            url: 'http://localhost:' + port
        }
    },
    servers: [
        {
            url: `http://localhost:${port}`,
            description: env === 'production' ? 'Producción' : 'Desarrollo'
        }
    ],
    components: {
        schemas: {
            Board: {
                type: 'object',
                required: ['id', 'name', 'owner_id'],
                properties: {
                    id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
                    name: { type: 'string', example: 'Mi Tablero' },
                    description: { type: 'string', example: 'Descripción del tablero' },
                    owner_id: { type: 'string', example: 'user123' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' }
                }
            },
            Note: {
                type: 'object',
                required: ['id', 'board_id', 'title'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    board_id: { type: 'string', format: 'uuid' },
                    title: { type: 'string', example: 'Nota importante' },
                    content: { type: 'string', example: 'Contenido de la nota' },
                    x: { type: 'integer', example: 100 },
                    y: { type: 'integer', example: 200 },
                    updated_by: { type: 'string', example: 'user123' },
                    version: { type: 'integer', example: 1 },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' }
                }
            },
            User: {
                type: 'object',
                required: ['id', 'name', 'socket_id'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: 'Juan Pérez' },
                    socket_id: { type: 'string', example: 'socket_abc123' },
                    connected_at: { type: 'string', format: 'date-time' }
                }
            },
            Comment: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    note_id: { type: 'string', format: 'uuid' },
                    user_name: { type: 'string', example: 'Juan' },
                    text: { type: 'string', example: 'Comentario sobre la nota' },
                    created_at: { type: 'string', format: 'date-time' }
                }
            },
            HealthResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['healthy', 'degraded'] },
                    timestamp: { type: 'string', format: 'date-time' },
                    server: {
                        type: 'object',
                        properties: {
                            environment: { type: 'string' },
                            uptime: { type: 'string' },
                            version: { type: 'string' }
                        }
                    },
                    database: {
                        type: 'object',
                        properties: {
                            connected: { type: 'boolean' },
                            url: { type: 'string' },
                            credentialsSet: { type: 'boolean' }
                        }
                    },
                    memory: {
                        type: 'object',
                        properties: {
                            heapUsed: { type: 'string' },
                            heapTotal: { type: 'string' },
                            rss: { type: 'string' }
                        }
                    },
                    websocket: {
                        type: 'object',
                        properties: {
                            enabled: { type: 'boolean' },
                            transports: { type: 'array', items: { type: 'string' } }
                        }
                    }
                }
            }
        }
    },
    paths: {
        '/api/boards': {
            post: {
                summary: 'Crear un nuevo tablero',
                tags: ['Board'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'owner_id'],
                                properties: {
                                    name: { type: 'string', minLength: 1, maxLength: 100, example: 'Mi Tablero' },
                                    description: { type: 'string', example: 'Descripción del tablero' },
                                    owner_id: { type: 'string', example: 'user123' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Tablero creado exitosamente',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/Board' },
                                        timestamp: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    },
                    '400': {
                        description: 'Validación fallida'
                    }
                }
            },
            get: {
                summary: 'Listar tableros',
                tags: ['Board'],
                parameters: [
                    {
                        in: 'query',
                        name: 'owner_id',
                        schema: { type: 'string' },
                        description: 'Filtrar por propietario'
                    },
                    {
                        in: 'query',
                        name: 'page',
                        schema: { type: 'integer', default: 1 },
                        description: 'Número de página'
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { type: 'integer', default: 10 },
                        description: 'Registros por página'
                    }
                ],
                responses: {
                    '200': {
                        description: 'Lista de tableros',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Board' }
                                        },
                                        total: { type: 'integer' },
                                        page: { type: 'integer' },
                                        limit: { type: 'integer' },
                                        timestamp: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/boards/{id}': {
            get: {
                summary: 'Obtener un tablero por ID',
                tags: ['Board'],
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                        description: 'ID del tablero'
                    }
                ],
                responses: {
                    '200': {
                        description: 'Tablero encontrado',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/Board' },
                                        timestamp: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    },
                    '400': { description: 'ID inválido' },
                    '404': { description: 'Tablero no encontrado' }
                }
            },
            delete: {
                summary: 'Eliminar un tablero',
                tags: ['Board'],
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                        description: 'ID del tablero'
                    }
                ],
                responses: {
                    '200': { description: 'Tablero eliminado exitosamente' },
                    '400': { description: 'ID inválido' },
                    '404': { description: 'Tablero no encontrado' }
                }
            }
        },
        '/api/notes': {
            post: {
                summary: 'Crear una nueva nota',
                tags: ['Note'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['board_id', 'title', 'x', 'y', 'updated_by'],
                                properties: {
                                    board_id: { type: 'string', format: 'uuid' },
                                    title: { type: 'string', example: 'Nota importante' },
                                    content: { type: 'string', example: 'Contenido' },
                                    x: { type: 'integer', example: 100 },
                                    y: { type: 'integer', example: 200 },
                                    updated_by: { type: 'string', example: 'user123' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Nota creada',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/Note' },
                                        timestamp: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    },
                    '400': { description: 'Validación fallida' }
                }
            },
            get: {
                summary: 'Listar notas de un tablero',
                tags: ['Note'],
                parameters: [
                    {
                        in: 'query',
                        name: 'board_id',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                        description: 'ID del tablero'
                    },
                    {
                        in: 'query',
                        name: 'page',
                        schema: { type: 'integer', default: 1 }
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { type: 'integer', default: 50 }
                    }
                ],
                responses: {
                    '200': {
                        description: 'Lista de notas',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Note' }
                                        },
                                        total: { type: 'integer' },
                                        page: { type: 'integer' },
                                        limit: { type: 'integer' },
                                        timestamp: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/notes/{id}': {
            get: {
                summary: 'Obtener una nota por ID',
                tags: ['Note'],
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                        description: 'ID de la nota'
                    }
                ],
                responses: {
                    '200': {
                        description: 'Nota encontrada',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/Note' },
                                        timestamp: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    },
                    '400': { description: 'ID inválido' },
                    '404': { description: 'Nota no encontrada' }
                }
            },
            put: {
                summary: 'Actualizar una nota',
                tags: ['Note'],
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string', format: 'uuid' }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['updated_by'],
                                properties: {
                                    title: { type: 'string' },
                                    content: { type: 'string' },
                                    x: { type: 'integer' },
                                    y: { type: 'integer' },
                                    updated_by: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': { description: 'Nota actualizada' },
                    '400': { description: 'Validación fallida' },
                    '404': { description: 'Nota no encontrada' }
                }
            },
            delete: {
                summary: 'Eliminar una nota',
                tags: ['Note'],
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string', format: 'uuid' }
                    }
                ],
                responses: {
                    '200': { description: 'Nota eliminada' },
                    '400': { description: 'ID inválido' },
                    '404': { description: 'Nota no encontrada' }
                }
            }
        },
        '/api/comments': {
            post: {
                summary: 'Agregar un comentario',
                tags: ['Comment'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['note_id', 'text'],
                                properties: {
                                    board_id: { type: 'string', format: 'uuid' },
                                    note_id: { type: 'string', format: 'uuid' },
                                    text: { type: 'string', example: 'Comentario sobre la nota' },
                                    user_name: { type: 'string', example: 'Juan' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Comentario creado',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/Comment' },
                                        timestamp: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/comments/{noteId}': {
            get: {
                summary: 'Listar comentarios de una nota',
                tags: ['Comment'],
                parameters: [
                    {
                        in: 'path',
                        name: 'noteId',
                        required: true,
                        schema: { type: 'string', format: 'uuid' }
                    },
                    {
                        in: 'query',
                        name: 'page',
                        schema: { type: 'integer', default: 1 }
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { type: 'integer', default: 20 }
                    }
                ],
                responses: {
                    '200': {
                        description: 'Lista de comentarios',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Comment' }
                                        },
                                        total: { type: 'integer' },
                                        page: { type: 'integer' },
                                        limit: { type: 'integer' },
                                        timestamp: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/users': {
            get: {
                summary: 'Listar usuarios conectados',
                tags: ['User'],
                parameters: [
                    {
                        in: 'query',
                        name: 'page',
                        schema: { type: 'integer', default: 1 }
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { type: 'integer', default: 20 }
                    }
                ],
                responses: {
                    '200': {
                        description: 'Lista de usuarios',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/User' }
                                        },
                                        total: { type: 'integer' },
                                        page: { type: 'integer' },
                                        limit: { type: 'integer' },
                                        timestamp: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/users/{id}': {
            get: {
                summary: 'Obtener un usuario por ID',
                tags: ['User'],
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                        description: 'ID del usuario'
                    }
                ],
                responses: {
                    '200': {
                        description: 'Usuario encontrado',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/User' },
                                        timestamp: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    },
                    '400': { description: 'ID inválido' },
                    '404': { description: 'Usuario no encontrado' }
                }
            }
        },
        '/health': {
            get: {
                summary: 'Health check del servidor',
                description: 'Verifica el estado general del servidor, BD y WebSocket',
                tags: ['System'],
                responses: {
                    '200': {
                        description: 'Servidor saludable',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/HealthResponse' }
                            }
                        }
                    },
                    '503': {
                        description: 'Servidor degradado (BD desconectada)'
                    }
                }
            }
        },
        '/api/version': {
            get: {
                summary: 'Versión de la API',
                tags: ['System'],
                responses: {
                    '200': {
                        description: 'Información de versión',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        version: { type: 'string', example: '1.0.0' },
                                        name: { type: 'string', example: 'Prueba Técnica 3 Backend' },
                                        uptime: { type: 'string', example: '3600s' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/status': {
            get: {
                summary: 'Estado de la base de datos',
                tags: ['System'],
                responses: {
                    '200': {
                        description: 'Estado de conexión BD',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        database: { type: 'string', enum: ['connected', 'disconnected'] },
                                        timestamp: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    'x-socketio': {
        description: 'WebSocket Events - Conexión en tiempo real',
        baseUrl: `ws://localhost:${port}`,
        events: {
            'join-board': {
                summary: 'Unirse a un tablero',
                description: 'Permite que un usuario se una a un tablero específico',
                tags: ['Board'],
                payload: {
                    type: 'object',
                    properties: {
                        board_id: { type: 'string', format: 'uuid', description: 'ID del tablero' },
                        user_name: { type: 'string', description: 'Nombre del usuario' }
                    },
                    required: ['board_id', 'user_name']
                },
                response: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        board_id: { type: 'string' },
                        users: { type: 'array', items: { $ref: '#/components/schemas/User' } }
                    }
                }
            },
            'create-board': {
                summary: 'Crear un nuevo tablero',
                description: 'Crea un tablero colaborativo nuevo',
                tags: ['Board'],
                payload: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Nombre del tablero' },
                        description: { type: 'string', description: 'Descripción' },
                        owner_id: { type: 'string', description: 'ID del propietario' }
                    },
                    required: ['name', 'owner_id']
                },
                response: { $ref: '#/components/schemas/Board' }
            },
            'create-note': {
                summary: 'Crear una nota',
                description: 'Crea una nueva nota en un tablero',
                tags: ['Note'],
                payload: {
                    type: 'object',
                    properties: {
                        board_id: { type: 'string', format: 'uuid' },
                        title: { type: 'string' },
                        content: { type: 'string' },
                        x: { type: 'integer' },
                        y: { type: 'integer' },
                        updated_by: { type: 'string' }
                    },
                    required: ['board_id', 'title', 'x', 'y', 'updated_by']
                },
                response: { $ref: '#/components/schemas/Note' }
            },
            'update-note': {
                summary: 'Actualizar una nota',
                description: 'Actualiza el contenido o posición de una nota',
                tags: ['Note'],
                payload: {
                    type: 'object',
                    properties: {
                        note_id: { type: 'string', format: 'uuid' },
                        title: { type: 'string' },
                        content: { type: 'string' },
                        x: { type: 'integer' },
                        y: { type: 'integer' },
                        updated_by: { type: 'string' }
                    },
                    required: ['note_id', 'updated_by']
                },
                response: { $ref: '#/components/schemas/Note' }
            },
            'delete-note': {
                summary: 'Eliminar una nota',
                description: 'Elimina una nota del tablero',
                tags: ['Note'],
                payload: {
                    type: 'object',
                    properties: {
                        note_id: { type: 'string', format: 'uuid' },
                        board_id: { type: 'string', format: 'uuid' }
                    },
                    required: ['note_id', 'board_id']
                },
                response: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        note_id: { type: 'string', format: 'uuid' }
                    }
                }
            },
            'add-comment': {
                summary: 'Agregar comentario a una nota',
                description: 'Añade un comentario a una nota específica',
                tags: ['Comment'],
                payload: {
                    type: 'object',
                    properties: {
                        note_id: { type: 'string', format: 'uuid' },
                        user_name: { type: 'string' },
                        text: { type: 'string' }
                    },
                    required: ['note_id', 'user_name', 'text']
                },
                response: { $ref: '#/components/schemas/Comment' }
            },
            'join-user': {
                summary: 'Usuario se conecta',
                description: 'Registra la conexión de un usuario al sistema',
                tags: ['User'],
                payload: {
                    type: 'object',
                    properties: {
                        user_name: { type: 'string' },
                        socket_id: { type: 'string' }
                    },
                    required: ['user_name', 'socket_id']
                },
                response: { $ref: '#/components/schemas/User' }
            }
        }
    },
    tags: [
        { name: 'System', description: 'Endpoints del sistema' },
        { name: 'Board', description: 'Gestión de tableros' },
        { name: 'Note', description: 'Gestión de notas' },
        { name: 'Comment', description: 'Sistema de comentarios' },
        { name: 'User', description: 'Gestión de usuarios' }
    ]
};

const swaggerOptions = {
    definition,
    apis: []
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Exportar configuración de Swagger UI
export const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true
    }
};