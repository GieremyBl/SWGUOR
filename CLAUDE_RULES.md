# Reglas de Desarrollo y Optimización de Tokens

## Comandos y Compilación
- NO ejecutes `npm run build` a menos que se te solicite explícitamente. Es un proceso pesado y consume tiempo/tokens en el ciclo de feedback.
- Para verificar errores de tipado o sintaxis, utiliza `npx tsc --noEmit` o revisa el archivo específico modificado.
- Si necesitas probar cambios en el entorno local, asume que el servidor de desarrollo (`npm run dev`) ya está corriendo.

## Alcance y Modificaciones
- Trabaja estrictamente en la funcionalidad solicitada (Caso de Uso por Caso de Uso). No hagas refactorizaciones masivas de archivos adyacentes si no es necesario.
- Si necesitas modificar la base de datos o el esquema de Prisma (`schema.prisma`), avísame antes de ejecutar `npx prisma migrate dev`.

## Estilo de Código
- Mantén la consistencia con TypeScript, Next.js (App Router), Prisma ORM y la arquitectura actual del proyecto.
- No elimines comentarios preexistentes que expliquen lógica de negocio compleja.