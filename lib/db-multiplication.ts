"use server"

import mysql from "mysql2/promise"
import type { MultiplicationGameResult, MultiplicationProblemResult } from "@/types/multiplication"

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'vocabulary_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

// Crear el pool de conexiones
// Nota: En Next.js con "use server", esto se ejecuta en el servidor.
// Idealmente deberíamos compartir el pool con el resto de la app, pero para no tocar
// código existente, creamos uno nuevo aquí.
const pool = mysql.createPool(dbConfig)

// Guardar resultado del juego de multiplicación
export async function saveMultiplicationGameResult(result: MultiplicationGameResult): Promise<boolean> {
  let connection

  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()
    console.log("DB: Transaction started for game result", result.id)

    // 1. Insertar el resultado del juego
    await connection.execute(
      `INSERT INTO multiplication_game_results 
       (id, user_id, date, score, total_questions, time_used, mode, tables_selected) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        result.id,
        result.userId,
        new Date(result.date),
        result.score,
        result.totalQuestions,
        result.timeUsed,
        result.mode,
        JSON.stringify(result.tablesSelected),
      ],
    )

    // 2. Insertar los resultados de cada problema
    if (result.problemResults.length > 0) {
      const values = result.problemResults.map((p) => [
        p.id,
        result.id,
        p.factorA,
        p.factorB,
        p.userAnswer,
        p.correct,
        p.timeUsed,
      ])

      // Construir la consulta para inserción múltiple
      const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ")
      const flatValues = values.flat()

      await connection.execute(
        `INSERT INTO multiplication_problem_results 
         (id, game_id, factor_a, factor_b, user_answer, correct, time_used) 
         VALUES ${placeholders}`,
        flatValues,
      )
    }

    await connection.commit()
    return true
  } catch (error) {
    if (connection) await connection.rollback()
    console.error("Error saving multiplication game result:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    return false
  } finally {
    if (connection) connection.release()
  }
}

// Cargar historial de juegos de multiplicación para un usuario
export async function loadMultiplicationHistory(userId: string): Promise<MultiplicationGameResult[]> {
  try {
    // 1. Obtener los juegos
    const [games] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT * FROM multiplication_game_results 
       WHERE user_id = ? 
       ORDER BY date DESC`,
      [userId],
    )

    if (!Array.isArray(games) || games.length === 0) {
      return []
    }

    const history: MultiplicationGameResult[] = []

    // 2. Para cada juego, obtener los detalles (esto podría optimizarse con un JOIN si son muchos datos)
    for (const game of games) {
      const [problems] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT * FROM multiplication_problem_results 
         WHERE game_id = ?`,
        [game.id],
      )

      history.push({
        id: game.id,
        userId: game.user_id,
        date: game.date.toISOString(),
        score: game.score,
        totalQuestions: game.total_questions,
        timeUsed: game.time_used,
        mode: game.mode,
        tablesSelected: typeof game.tables_selected === "string" ? JSON.parse(game.tables_selected) : game.tables_selected,
        problemResults: (problems as any[]).map((p) => ({
          id: p.id,
          gameId: p.game_id,
          factorA: p.factor_a,
          factorB: p.factor_b,
          userAnswer: p.user_answer,
          correct: Boolean(p.correct),
          timeUsed: p.time_used,
        })),
      })
    }

    return history
  } catch (error) {
    console.error("Error loading multiplication history:", error)
    return []
  }
}
