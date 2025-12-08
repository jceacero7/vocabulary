# Guía de Despliegue

Esta guía explica cómo desplegar tu aplicación Next.js. Dado que tu proyecto utiliza una base de datos MySQL (`mysql2`), la opción recomendada es **Vercel**, ya que permite ejecutar código del lado del servidor (Serverless Functions) necesario para conectar con la base de datos.

## Opción 1: Despliegue en Vercel (Recomendado)

Vercel es la plataforma creada por los autores de Next.js y ofrece la mejor compatibilidad.

### Requisitos Previos
1.  Tener tu código subido a un repositorio de **GitHub**.
2.  Tener una cuenta en [Vercel](https://vercel.com/).
3.  Tener una base de datos MySQL alojada en la nube (ej. PlanetScale, Railway, AWS RDS, o un VPS). **Vercel no aloja la base de datos**, solo la aplicación.

### Pasos
1.  **Inicia sesión en Vercel** con tu cuenta de GitHub.
2.  Haz clic en **"Add New..."** > **"Project"**.
3.  Selecciona tu repositorio de GitHub (`Vocabulary` o el nombre que tenga).
4.  Configura el proyecto:
    *   **Framework Preset**: Next.js (se detectará automáticamente).
    *   **Root Directory**: `./` (o déjalo por defecto).
    *   **Environment Variables**: Aquí es donde debes poner las credenciales de tu base de datos. Copia las variables de tu archivo `.env` local (ej. `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
5.  Haz clic en **"Deploy"**.

Vercel construirá tu aplicación y te dará una URL pública.

---

## Opción 2: Despliegue en GitHub Pages

**IMPORTANTE**: GitHub Pages solo aloja sitios **estáticos** (HTML, CSS, JS). Como tu aplicación usa una base de datos MySQL, **muchas funcionalidades no funcionarán** si despliegas aquí, a menos que refactorices la app para que el frontend consuma una API externa separada.

Si aún así deseas desplegar una versión estática (solo interfaz):

### Pasos
1.  Abre `next.config.mjs` y añade la configuración de exportación:
    ```javascript
    const nextConfig = {
      output: 'export', // Añade esta línea
      // ... resto de tu configuración
    }
    ```
2.  Abre `package.json` y modifica el script de build:
    ```json
    "scripts": {
      "build": "next build",
      // ...
    }
    ```
    (Nota: Al usar `output: 'export'`, `next build` generará una carpeta `out`).
3.  Sube tus cambios a GitHub.
4.  Ve a la pestaña **Settings** de tu repositorio en GitHub.
5.  Ve a la sección **Pages**.
6.  En **Build and deployment**, selecciona **GitHub Actions**.
7.  GitHub sugerirá un workflow para Next.js estático. Configúralo para que despliegue el contenido de la carpeta `out`.

**Nota:** Es probable que el comando `next build` falle si intenta conectarse a la base de datos durante la construcción (Static Site Generation) y no tiene acceso, o si usas `getServerSideProps` / Server Components que requieren datos dinámicos en tiempo de ejecución.

---

## Resumen

| Característica | Vercel | GitHub Pages |
| :--- | :--- | :--- |
| **Soporte Base de Datos** | ✅ Sí (vía Serverless) | ❌ No (Solo estático) |
| **Facilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Coste** | Gratuito (Hobby) | Gratuito |
| **Recomendado para este proyecto** | **SÍ** | **NO** |
