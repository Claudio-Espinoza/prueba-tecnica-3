# Bitacora

## Primera iteación

Usando la estructura propuesta por la prueba tecnica, esta misma deberia funcionar pero para la solución inicial sin considerar las bonificaciones. A esto se reconocen los siguientes problemas:

1. Arquitectura y Organización
   - No hay separación de responsabilidades (todo mezclado en handlers)
   - Sin capa de servicios
   - Sin repositorios o capa de datos
   - Lógica de negocio acoplada a Socket.IO
   - No hay validación de datos
   - Sin manejo de errores robusto
2. Persistencia
   - Datos en memoria (se pierden al reiniciar)
   - Sin base de datos real
   - Sin migraciones ni esquemas
3. TypeScript y Tipado
   - Código en JavaScript sin tipos
   - Sin validación en tiempo de compilación
   - Propenso a errores en runtime
4. Concurrencia y Realtime
   - No hay manejo de condiciones de carrera
   - Sin versionado optimista
   - Sin manejo de reconexión
   - Sin retry logic
5. Testing
   - Cero tests
   - Sin configuración de testing
6. Escalabilidad
   - Estado en memoria (no funciona con múltiples instancias)
   - Sin Redis para sesiones distribuidas
   - Sin consideración para horizontal scaling

El orden no es representativo del orden en el que se bordara

## Segunda iteración

He termiando siguiendo los principios de DDD pero por disposición de tiempo, no podre implementar a profundidad practicas como los logs de varios niveles. Actualmente lo tengo pero no me rinde implmentarlo en todo el proyecto.
