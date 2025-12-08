const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function seed() {
    try {
        // 1. Leer variables de entorno de .env.local
        const envPath = path.join(__dirname, '..', '.env.local');
        let envContent = '';
        try {
            envContent = fs.readFileSync(envPath, 'utf8');
        } catch (e) {
            console.error('No se encontró el archivo .env.local');
            process.exit(1);
        }

        const envVars = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                envVars[key] = value;
            }
        });

        const config = {
            host: envVars.MYSQL_HOST || 'localhost',
            user: envVars.MYSQL_USER || 'root',
            password: envVars.MYSQL_PASSWORD || '',
            database: envVars.MYSQL_DATABASE || 'vocabulary_db',
            multipleStatements: true // Importante para ejecutar el script completo
        };

        console.log('Conectando a la base de datos...', { ...config, password: '****' });

        // 2. Conectar a la base de datos
        const connection = await mysql.createConnection(config);
        console.log('Conectado exitosamente.');

        // 3. Leer el archivo SQL
        const sqlPath = path.join(__dirname, '..', 'init-database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // 4. Ejecutar el SQL
        console.log('Ejecutando script SQL...');
        await connection.query(sql);

        console.log('¡Base de datos inicializada y datos cargados correctamente!');
        await connection.end();

    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        process.exit(1);
    }
}

seed();
