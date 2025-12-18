# Prueba Técnica 3 - Tablero Colaborativo en Tiempo Real

Aplicación full-stack para gestionar tableros colaborativos con sincronización en tiempo real usando WebSockets.

## 📋 Requisitos Previos

- **Node.js**: 16.x o superior
- **npm** o **pnpm**: Gestor de paquetes
- **Git**: Control de versiones

Verifica las versiones instaladas:

```bash
node --version
npm --version
```

## 🚀 Guía de Ejecución

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/Claudio-Espinoza/prueba-tecnica-3.git
cd prueba-tecnica-3
```

### 2️⃣ Configurar Backend

#### Instalar Dependencias

```bash
cd backend
npm install
```

#### Iniciar Backend

**Desarrollo (con hot reload)**:

```bash
npm run dev
```

**Producción**:

```bash
npm run build
npm start
```

El backend estará disponible en: `http://localhost:3001`

### 3️⃣ Configurar Frontend

#### Instalar Dependencias

```bash
cd frontend
npm install
# o si prefieres usar pnpm
pnpm install
```

#### Iniciar Frontend

**Desarrollo**:

```bash
npm run dev
# o
pnpm dev
```

El frontend estará disponible en: `http://localhost:5173`

### 4️⃣ Acceder a la Aplicación

Una vez que backend y frontend están ejecutándose, abre tu navegador:

```
http://localhost:5173
```

## 📚 Comandos Útiles

### Backend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Ejecutar en desarrollo con hot reload |
| `npm run build` | Compilar TypeScript |
| `npm start` | Iniciar servidor compilado |
| `npm run lint` | Verificar código con ESLint |
| `npm run typecheck` | Verificar tipos con TypeScript |
| `npm run format` | Formatear código con Prettier |
| `npm run test:db` | Probar base de datos |

### Frontend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Ejecutar servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run preview` | Previsualizar build de producción |
| `npm run lint` | Verificar y reparar código |
| `npm run format` | Formatear código |
| `npm run lint:check` | Verificar código sin reparar |

## 📖 Documentación

### API REST

La documentación interactiva está disponible en:

```
http://localhost:3001/api/docs
```

### WebSocket Events

El servidor maneja eventos en tiempo real para:
- Crear y actualizar notas
- Crear y actualizar tableros
- Agregar comentarios
- Gestión de usuarios conectados

## 🔧 Estructura del Proyecto

```
prueba-tecnica-3/
├── backend/                 # API REST + WebSocket
│   ├── src/
│   │   ├── app.ts          # Configuración Express
│   │   ├── server.ts       # Punto de entrada
│   │   ├── application/    # DTOs y servicios
│   │   ├── domain/         # Lógica de negocio
│   │   ├── infrastructure/ # Persistencia y adaptadores
│   │   └── presentation/   # Rutas y middleware
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                # Aplicación Vue 3
    ├── src/
    │   ├── App.vue
    │   ├── main.ts
    │   ├── components/      # Componentes reutilizables
    │   ├── features/        # Vistas y características
    │   ├── services/        # Servicios (socket, konva)
    │   ├── stores/          # Pinia stores
    │   └── platforms/       # Rutas y estilos
    ├── package.json
    └── vite.config.ts
```

## 🐛 Solución de Problemas

### El frontend no se conecta al backend

- Verifica que el backend esté ejecutándose en `http://localhost:3001`
- Revisa la variable `CORS_ORIGIN` en `.env` del backend
- Abre la consola del navegador (F12) para ver errores de conexión

### Puerto ya en uso

Si el puerto 3001 o 5173 está en uso, cambia los puertos:

**Backend**: Modifica `PORT` en `.env`

**Frontend**: Modifica en `vite.config.ts`:
```typescript
export default {
  server: {
    port: 5174 // Cambia al puerto que prefieras
  }
}
```

### Errores de módulos no encontrados

Limpia e reinstala dependencias:

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📝 Notas

- La base de datos SQLite se crea automáticamente en `backend/data/`
- Los logs se guardan en `backend/logs/`
- El frontend usa Tailwind CSS + Vue 3 + Konva Canvas
- WebSocket permite sincronización en tiempo real entre usuarios

## 🤝 Desarrollo

Para desarrollo simultáneo, abre dos terminales:

**Terminal 1 - Backend**:
```bash
cd backend && npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend && npm run dev
```

Ambos servicios soportan hot reload en desarrollo.

---

¡Listo! Ya puedes usar la aplicación colaborativa en tiempo real. 🎉
