# Guía de Uso con Docker

Esta guía explica cómo ejecutar la aplicación completa (App + Base de Datos) utilizando Docker. Esto es ideal para tener un entorno aislado y reproducible sin instalar dependencias en tu máquina local.

## Requisitos Previos

1.  **Docker Desktop**: Tener instalado y ejecutándose Docker Desktop.

## Pasos para Ejecutar

1.  **Abrir una terminal** en la raíz del proyecto.

2.  **Construir y levantar los contenedores**:
    Ejecuta el siguiente comando:
    ```bash
    docker-compose up --build
    ```
    *   `--build`: Fuerza a reconstruir la imagen de la aplicación (útil si has cambiado código).
    *   Si quieres que se ejecute en segundo plano (sin bloquear la terminal), añade `-d`: `docker-compose up -d --build`.

3.  **Acceder a la aplicación**:
    Abre tu navegador en [http://localhost:3000](http://localhost:3000).

## ¿Qué sucede "bajo el capó"?

*   **Base de Datos (MySQL)**:
    *   Se crea un contenedor con MySQL 8.0.
    *   Automáticamente ejecuta el script `init-database.sql` la primera vez para crear las tablas y datos.
    *   Los datos se persisten en un volumen llamado `db_data`, por lo que no se pierden al apagar el contenedor.

*   **Aplicación (Next.js)**:
    *   Se construye una imagen optimizada basada en `node:18-alpine`.
    *   Se conecta automáticamente al contenedor de base de datos usando las variables de entorno definidas en `docker-compose.yml`.

## Comandos Útiles

*   **Detener los contenedores**:
    ```bash
    docker-compose down
    ```

*   **Ver logs (si usaste -d)**:
    ```bash
    docker-compose logs -f
    ```

*   **Borrar todo (incluida la base de datos)**:
    Si quieres empezar de cero (borrar datos persistentes):
    ```bash
    docker-compose down -v
    ```
