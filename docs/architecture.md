# Arquitectura y Stack Tecnológico

## Resumen del Proyecto
Esta es una aplicación web educativa para el aprendizaje de vocabulario en inglés. Permite a los usuarios repasar palabras por categorías, realizar tests (Spelling Bee) y ver su progreso.

## Stack Tecnológico

### Frontend & Framework
*   **Next.js 14 (App Router)**: Framework principal. Se utiliza el sistema de enrutado basado en carpetas (`app/`).
*   **React 18**: Librería de UI.
*   **TypeScript**: Lenguaje de programación para mayor seguridad de tipos.
*   **Tailwind CSS**: Framework de estilos utilitarios.
*   **Shadcn/UI**: Colección de componentes de UI reutilizables (basados en Radix UI).
*   **Lucide React**: Librería de iconos.

### Backend & Base de Datos
*   **Next.js API Routes**: El backend está integrado en el mismo proyecto usando Route Handlers (`app/api/`).
*   **MySQL**: Base de datos relacional.
*   **mysql2**: Cliente de MySQL para Node.js.

### Infraestructura (Local)
*   **Node.js**: Entorno de ejecución.
*   **Docker** (Opcional): Para contenerización de la app y la base de datos.

## Estructura de Carpetas Clave

*   `app/`: Código fuente de la aplicación (páginas, layouts, API).
    *   `api/`: Endpoints del backend (ej. `api/db/words`).
    *   `components/`: Componentes de React reutilizables.
*   `lib/`: Utilidades y funciones auxiliares.
*   `public/`: Archivos estáticos (imágenes, iconos).
*   `docs/`: Documentación del proyecto.
*   `scripts/`: Scripts de mantenimiento (ej. `seed-db.js`).

## Flujo de Datos
1.  El usuario interactúa con la interfaz (React).
2.  Los componentes hacen peticiones `fetch` a los endpoints internos (`/api/...`).
3.  Los endpoints (`route.ts`) usan el pool de conexiones MySQL (`lib/db` o similar) para consultar la base de datos.
4.  Los datos se devuelven en formato JSON al frontend.
