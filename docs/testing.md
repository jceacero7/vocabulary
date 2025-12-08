# Guía de Pruebas en Local

Esta guía explica cómo ejecutar tu aplicación en tu ordenador para probarla antes de desplegar.

## Requisitos Previos

1.  **Node.js**: Asegúrate de tener Node.js instalado (versión 18 o superior recomendada).
2.  **Base de Datos MySQL**: Necesitas una base de datos MySQL en ejecución. Puede ser:
    *   Local (instalada en tu máquina, ej. XAMPP, MySQL Workbench, Docker).
    *   Remota (la misma que usarás en producción, si tienes acceso).

## Configuración Inicial

1.  **Instalar dependencias**:
    Si aún no lo has hecho, instala las librerías del proyecto:
    ```bash
    npm install
    # O si usas pnpm/yarn:
    # pnpm install
    # yarn install
    ```

2.  **Configurar Variables de Entorno**:
    Crea un archivo llamado `.env.local` (o `.env`) en la raíz del proyecto si no existe. Debe contener las credenciales de tu base de datos:

    ```env
    DB_HOST=localhost
    DB_USER=tu_usuario
    DB_PASSWORD=tu_contraseña
    DB_NAME=nombre_de_tu_base_de_datos
    ```

3.  **Inicializar la Base de Datos**:
    Si es la primera vez, ejecuta el script SQL incluido en el proyecto para crear las tablas necesarias. Puedes usar una herramienta como MySQL Workbench, DBeaver o la línea de comandos:
    
    ```bash
    mysql -u tu_usuario -p nombre_de_tu_base_de_datos < init-database.sql
    ```

## Ejecutar en Modo Desarrollo

Este es el modo estándar para programar. Los cambios se reflejan casi al instante.

```bash
npm run dev
```

*   Abre tu navegador en [http://localhost:3000](http://localhost:3000).
*   Cualquier cambio que hagas en el código se actualizará automáticamente.

## Ejecutar en Modo Producción (Simulación)

Para probar cómo se comportará la aplicación realmente cuando esté desplegada (rendimiento real, sin herramientas de depuración):

1.  **Construir la aplicación**:
    ```bash
    npm run build
    ```
    Esto creará una carpeta `.next` optimizada.

2.  **Iniciar el servidor**:
    ```bash
    npm run start
    ```

*   La app estará disponible en [http://localhost:3000](http://localhost:3000).
*   Este modo es útil para verificar que el proceso de `build` no tiene errores.

## Pruebas Automáticas

Actualmente el proyecto no tiene configurado un framework de pruebas automáticas (como Jest o Playwright). Si deseas añadirlos en el futuro, sería necesario instalar las dependencias correspondientes y configurar los scripts de test.
