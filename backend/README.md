# Prueba Técnica 3 - Backend API

API de tableros colaborativos en tiempo real. Sistema completo con soporte para REST API y WebSocket para sincronización en tiempo real.

## 📋 Descripción

Este backend proporciona una API para gestionar tableros colaborativos (similar a Trello) con las siguientes características:

- ✅ Gestión de tableros (crear, listar, obtener, eliminar)
- ✅ Gestión de notas con posicionamiento en canvas (x, y)
- ✅ Sistema de comentarios en notas
- ✅ Sincronización en tiempo real vía WebSocket
- ✅ Gestión de usuarios conectados
- ✅ Validación de entrada completa
- ✅ Documentación interactiva con Swagger
- ✅ Logging estructurado
- ✅ Health checks del servidor

## 🛠 Requisitos

- **Node.js**: 16.x o superior
- **npm**: 7.x o superior
- **Supabase**: Cuenta con proyecto configurado
- **TypeScript**: 4.x o superior

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Claudio-Espinoza/prueba-tecnica-3.git
cd prueba-tecnica-3/backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env`:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# CORS
CORS_ORIGIN=http://localhost:3000

# API
API_VERSION=1.0.0
```

### 4. Construir el proyecto

```bash
npm run build
```

## 🚀 Uso

### Desarrollo (con hot reload)

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3001`

### Producción

```bash
npm run build
npm start
```

## 📚 Endpoints REST

### Base URL: `http://localhost:3001`

### Tableros (Boards)

#### Crear tablero

```http
POST /api/boards
Content-Type: application/json

{
  "name": "Mi Tablero",
  "description": "Descripción opcional",
  "owner_id": "user123"
}
```

**Respuesta (201)**:

```json
{
   "success": true,
   "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Mi Tablero",
      "description": "Descripción opcional",
      "owner_id": "user123",
      "created_at": "2025-12-17T21:00:00Z",
      "updated_at": "2025-12-17T21:00:00Z"
   },
   "timestamp": "2025-12-17T21:00:00Z"
}
```

#### Listar tableros

```http
GET /api/boards?page=1&limit=10&owner_id=user123
```

**Parámetros de query**:

- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Registros por página (default: 10)
- `owner_id` (opcional): Filtrar por propietario

#### Obtener tablero por ID

```http
GET /api/boards/{id}
```

#### Eliminar tablero

```http
DELETE /api/boards/{id}
```

---

### Notas (Notes)

#### Crear nota

```http
POST /api/notes
Content-Type: application/json

{
  "board_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Nota importante",
  "content": "Contenido de la nota",
  "x": 100,
  "y": 200,
  "updated_by": "user123"
}
```

#### Listar notas de un tablero

```http
GET /api/notes?board_id=550e8400-e29b-41d4-a716-446655440000&page=1&limit=50
```

**Parámetros de query**:

- `board_id` (requerido): ID del tablero
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Registros por página (default: 50)

#### Obtener nota por ID

```http
GET /api/notes/{id}
```

#### Actualizar nota

```http
PUT /api/notes/{id}
Content-Type: application/json

{
  "title": "Título actualizado",
  "content": "Contenido actualizado",
  "x": 150,
  "y": 250,
  "updated_by": "user123"
}
```

#### Eliminar nota

```http
DELETE /api/notes/{id}
```

---

### Comentarios (Comments)

#### Agregar comentario

```http
POST /api/comments
Content-Type: application/json

{
  "board_id": "550e8400-e29b-41d4-a716-446655440000",
  "note_id": "550e8400-e29b-41d4-a716-446655440001",
  "text": "Comentario sobre la nota",
  "user_name": "Juan Pérez"
}
```

#### Listar comentarios de una nota

```http
GET /api/comments/{noteId}?page=1&limit=20
```

**Parámetros de query**:

- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Registros por página (default: 20)

---

### Usuarios (Users)

#### Listar usuarios conectados

```http
GET /api/users?page=1&limit=20
```

#### Obtener usuario por ID

```http
GET /api/users/{id}
```

---

### Sistema (System)

#### Health Check

```http
GET /health
```

#### Versión de la API

```http
GET /api/version
```

#### Estado de la BD

```http
GET /api/status
```

## 🔌 WebSocket Events

La aplicación soporta sincronización en tiempo real vía WebSocket. Conéctate a `ws://localhost:3001`

### Eventos disponibles

#### join-board

Se ejecuta cuando un usuario se une a un tablero:

```javascript
socket.emit('join-board', {
   board_id: '550e8400-e29b-41d4-a716-446655440000',
   user_name: 'Juan Pérez',
});

socket.on('join-board', (response) => {
   console.log('Usuarios en el tablero:', response.users);
});
```

#### create-board

```javascript
socket.emit('create-board', {
   name: 'Mi Tablero',
   description: 'Descripción',
   owner_id: 'user123',
});
```

#### create-note

```javascript
socket.emit('create-note', {
   board_id: '550e8400-e29b-41d4-a716-446655440000',
   title: 'Nota',
   content: 'Contenido',
   x: 100,
   y: 200,
   updated_by: 'user123',
});
```

#### update-note

```javascript
socket.emit('update-note', {
   note_id: '550e8400-e29b-41d4-a716-446655440001',
   title: 'Título actualizado',
   x: 150,
   y: 250,
   updated_by: 'user123',
});
```

#### delete-note

```javascript
socket.emit('delete-note', {
   note_id: '550e8400-e29b-41d4-a716-446655440001',
   board_id: '550e8400-e29b-41d4-a716-446655440000',
});
```

#### add-comment

```javascript
socket.emit('add-comment', {
   note_id: '550e8400-e29b-41d4-a716-446655440001',
   user_name: 'Juan',
   text: 'Comentario sobre la nota',
});
```

#### join-user

```javascript
socket.emit('join-user', {
   user_name: 'Juan Pérez',
   socket_id: 'socket_abc123',
});
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── app.ts                          # Configuración de Express
│   ├── server.ts                       # Punto de entrada del servidor
│   ├── socketHandlers.js               # Manejadores de WebSocket
│   ├── application/
│   │   ├── dtos/                       # Data Transfer Objects
│   │   │   ├── board-dto.ts
│   │   │   └── note-dto.ts
│   │   ├── services/                   # Servicios de negocio
│   │   │   ├── board.ts
│   │   │   ├── note.ts
│   │   │   └── user.ts
│   │   └── usecases/                   # Casos de uso
│   │       ├── create-board.ts
│   │       ├── create-note.ts
│   │       ├── update-note.ts
│   │       ├── delete-note.ts
│   │       ├── add-comment.ts
│   │       ├── join-board.ts
│   │       └── join-user.ts
│   ├── domain/
│   │   ├── entities/                   # Modelos de dominio
│   │   │   ├── board.ts
│   │   │   ├── note.ts
│   │   │   ├── comment.ts
│   │   │   ├── user.ts
│   │   │   └── role.ts
│   │   ├── errors/                     # Errores de dominio
│   │   │   └── index.ts
│   │   ├── repositories/               # Interfaces de repositorios
│   │   │   ├── board.ts
│   │   │   ├── note.ts
│   │   │   └── user.ts
│   │   └── value-objects/              # Value Objects
│   │       ├── board-id.ts
│   │       ├── note-id.ts
│   │       ├── user-id.ts
│   │       └── position.ts
│   ├── infrastructure/
│   │   ├── enviroment/                 # Configuración de entorno
│   │   │   └── env.ts
│   │   ├── logger/                     # Sistema de logging
│   │   │   └── index.ts
│   │   ├── persistence/                # Persistencia de datos
│   │   │   ├── config/
│   │   │   │   ├── client.ts           # Cliente Supabase
│   │   │   │   └── model-query.ts
│   │   │   └── repositories/           # Implementaciones de repositorios
│   │   │       ├── board.ts
│   │   │       ├── note.ts
│   │   │       └── user.ts
│   │   ├── socket/                     # WebSocket
│   │   │   └── adapter.ts
│   │   └── swagger/                    # Documentación API
│   │       └── index.ts
│   └── presentation/
│       ├── gateway/                    # Gateways de comunicación
│       │   └── socket.ts
│       ├── middleware/                 # Middlewares Express
│       │   ├── auth.ts
│       │   └── handler.ts
│       ├── routes/                     # Rutas REST
│       │   ├── board.ts
│       │   ├── note.ts
│       │   ├── comment.ts
│       │   ├── user.ts
│       │   └── config/
│       │       ├── types.ts            # Tipos de request/response
│       │       └── validations.ts      # Validación de entrada
│       └── socket/                     # Manejadores WebSocket
│           ├── events.ts
│           └── handler/
│               ├── board.ts
│               ├── comment.ts
│               ├── note.ts
│               └── user.ts
├── logs/                               # Archivos de log
├── package.json
├── tsconfig.json
└── README.md
```

## 🏗 Arquitectura

El proyecto sigue **Clean Architecture** con capas bien definidas:

```
┌─────────────────────────────────────┐
│      Presentation (Express/Socket)  │ ← Routes, Middleware, WebSocket handlers
├─────────────────────────────────────┤
│      Application (UseCases)         │ ← Lógica de casos de uso
├─────────────────────────────────────┤
│      Domain (Entities)              │ ← Lógica de negocio, Value Objects
├─────────────────────────────────────┤
│      Infrastructure (Supabase)      │ ← Persistencia, Logger, Socket
└─────────────────────────────────────┘
```

### Patrón de Tipado REST

Todos los handlers REST siguen este patrón:

```typescript
router.endpoint(
   '/:param',
   async (
      req: Request<Params, ResponseType, BodyType, QueryType>,
      res: Response<SuccessResponse | ErrorResponse>
   ): Promise<void> => {
      try {
         // Validar entrada con early return
         // Ejecutar UseCase
         // Responder con éxito
      } catch (error: unknown) {
         logger.error('MODULE', 'Error message', error as Error);
         res.status(500).json(buildErrorResponse(error as Error));
      }
   }
);
```

## 🔐 Validación

Todos los endpoints validan su entrada:

- **UUID validation**: Todos los IDs son validados como UUID válidos
- **String validation**: Min/max length, caracteres requeridos
- **Number validation**: Range validation, integer checks
- **Pagination**: Page y limit con valores por defecto seguros
- **Business rules**: Validaciones de lógica de negocio en UseCases

## 📊 Logging

Sistema de logging con niveles:

```
DEBUG   - Información detallada de debugging
INFO    - Eventos de aplicación importantes
WARN    - Advertencias sobre comportamiento inusual
ERROR   - Errores que necesitan atención
```

Todos los logs incluyen timestamp y contexto del módulo.

## 🧪 Scripts Disponibles

```bash
# Desarrollo con hot reload
npm run dev

# Build de TypeScript
npm run build

# Iniciar servidor en producción
npm start

# Ver todos los scripts disponibles
npm run
```

## 🔗 Integración con Frontend

### CORS

Asegúrate de que tu frontend esté incluido en las variables de entorno `CORS_ORIGIN`.

### WebSocket

Conexión desde cliente:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
   reconnection: true,
   reconnectionDelay: 1000,
   reconnectionDelayMax: 5000,
   reconnectionAttempts: 5,
});

socket.on('connect', () => {
   console.log('Conectado al servidor');
});
```

### REST API

Usa `fetch` o `axios`:

```javascript
// Crear tablero
const response = await fetch('http://localhost:3001/api/boards', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
      name: 'Mi Tablero',
      owner_id: 'user123',
   }),
});
const data = await response.json();
```

## 📖 Documentación Interactiva (Swagger)

Accede a la documentación interactiva en:

```
http://localhost:3001/api-docs
```

Aquí puedes probar todos los endpoints REST directamente desde el navegador.

## 🐛 Troubleshooting

### Error de conexión a Supabase

```
Error: Missing Supabase env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

**Solución**: Verifica las variables de entorno en `.env`

### Puerto ya en uso

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solución**: Cambia el puerto en `.env` o mata el proceso que usa el puerto 3001

### WebSocket no conecta

```
Error: WebSocket connection failed
```

**Solución**: Verifica que CORS_ORIGIN sea la URL correcta del frontend

## 📝 Notas Importantes

- **Autenticación**: Actualmente implementada como `user_id` en payloads. Integrar con JWT/OAuth según necesidad.
- **Persistencia**: Los datos se guardan en Supabase. Asegúrate de tener las tablas creadas.
- **Rate Limiting**: No implementado. Considera agregar rate limiting en producción.
- **Validation Errors**: Los errores de validación retornan con status 400 y un array de errores detallado.

## 🤝 Contribuir

1. Crear rama feature: `git checkout -b feature/AmazingFeature`
2. Commit cambios: `git commit -m 'Add some AmazingFeature'`
3. Push: `git push origin feature/AmazingFeature`
4. Abrir Pull Request

## 📄 Licencia

Este proyecto es privado.

## 📞 Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: 17 de diciembre de 2025
