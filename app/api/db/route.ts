import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

// MySQL connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
}

// Create a connection pool
let pool: mysql.Pool | null = null

const getPool = () => {
  if (!pool) {
    // Verificar que todas las variables de entorno estén definidas
    if (
      !process.env.MYSQL_HOST ||
      !process.env.MYSQL_USER ||
      !process.env.MYSQL_PASSWORD ||
      !process.env.MYSQL_DATABASE
    ) {
      throw new Error("MySQL environment variables are not configured")
    }

    pool = mysql.createPool({
      ...dbConfig,
      connectTimeout: 10000, // 10 segundos de timeout para la conexión
      waitForConnections: true,
      connectionLimit: 10,
    })
  }
  return pool
}

// Initialize database tables
async function initializeDatabase() {
  try {
    const pool = getPool()

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `)

    // Create words table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS words (
        id VARCHAR(36) PRIMARY KEY,
        english VARCHAR(100) NOT NULL,
        spanish VARCHAR(100) NOT NULL,
        category_id VARCHAR(36),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `)

    // Create game_results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_results (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        score INT NOT NULL,
        total_words INT NOT NULL,
        time_used INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create game_categories table (for many-to-many relationship)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_categories (
        game_id VARCHAR(36) NOT NULL,
        category_id VARCHAR(36) NOT NULL,
        PRIMARY KEY (game_id, category_id),
        FOREIGN KEY (game_id) REFERENCES game_results(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `)

    // Create word_results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS word_results (
        id VARCHAR(36) PRIMARY KEY,
        game_id VARCHAR(36) NOT NULL,
        spanish VARCHAR(100) NOT NULL,
        english VARCHAR(100) NOT NULL,
        user_answer VARCHAR(100),
        correct BOOLEAN NOT NULL,
        time_used INT NOT NULL,
        FOREIGN KEY (game_id) REFERENCES game_results(id) ON DELETE CASCADE
      )
    `)

    return true
  } catch (error) {
    console.error("Database initialization error:", error)
    return false
  }
}

// API route handler
export async function GET(request: Request) {
  try {
    // Verificar que las variables de entorno estén configuradas
    if (
      !process.env.MYSQL_HOST ||
      !process.env.MYSQL_USER ||
      !process.env.MYSQL_PASSWORD ||
      !process.env.MYSQL_DATABASE
    ) {
      return NextResponse.json({ error: "MySQL environment variables are not configured" }, { status: 500 })
    }

    const initialized = await initializeDatabase()

    if (!initialized) {
      return NextResponse.json({ error: "Failed to initialize database" }, { status: 500 })
    }

    return NextResponse.json({ message: "Database initialized successfully" })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper functions for database operations
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const pool = getPool()
    const [results] = await pool.query(query, params)
    return results
  } catch (error) {
    console.error("Query execution error:", error)
    throw error
  }
}
