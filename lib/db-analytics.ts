"use server"

import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'vocabulary_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

const pool = mysql.createPool(dbConfig)

export async function getUserEvolution(userId: string) {
  try {
    // Get last 20 games for evolution graph
    const [rows] = await pool.execute(`
      SELECT 
        id,
        DATE_FORMAT(date, '%d/%m %H:%i') as label,
        score,
        total_questions,
        (score / total_questions) * 100 as accuracy
      FROM multiplication_game_results 
      WHERE user_id = ? 
      ORDER BY date ASC 
      LIMIT 100
    `, [userId])
    return rows as any[]
  } catch (error) {
    console.error("Error fetching user evolution:", error)
    return []
  }
}

export async function getUserHeatmap(userId: string) {
  try {
    // Aggregate results for each multiplication pair
    const [rows] = await pool.execute(`
      SELECT 
        factor_a,
        factor_b,
        SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct_count,
        SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END) as incorrect_count
      FROM multiplication_problem_results pr
      JOIN multiplication_game_results gr ON pr.game_id = gr.id
      WHERE gr.user_id = ?
      GROUP BY factor_a, factor_b
    `, [userId])
    return rows as any[]
  } catch (error) {
    console.error("Error fetching user heatmap:", error)
    return []
  }
}

export async function getUserHistory(userId: string) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        date,
        score,
        total_questions,
        time_used,
        mode
      FROM multiplication_game_results 
      WHERE user_id = ? 
      ORDER BY date DESC 
      LIMIT 50
    `, [userId])
    return rows as any[]
  } catch (error) {
    console.error("Error fetching user history:", error)
    return []
  }
}

export async function getMostFailedQuestions(userId: string, limit: number = 10) {
  try {
    // Find questions with highest failure rate (min 3 attempts to be significant)
    // Using interpolation for LIMIT to avoid prepared statement issues with some MySQL versions/drivers
    const [rows] = await pool.execute(`
      SELECT 
        factor_a,
        factor_b,
        SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END) as failures,
        COUNT(*) as attempts
      FROM multiplication_problem_results pr
      JOIN multiplication_game_results gr ON pr.game_id = gr.id
      WHERE gr.user_id = ?
      GROUP BY factor_a, factor_b
      HAVING attempts >= 3 AND failures > 0
      ORDER BY failures DESC, attempts DESC
      LIMIT ${Number(limit)}
    `, [userId])
    return rows as any[]
  } catch (error) {
    console.error("Error fetching most failed questions:", error)
    return []
  }
}

export async function getGameDetails(gameId: string) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        factor_a,
        factor_b,
        user_answer,
        correct,
        time_used
      FROM multiplication_problem_results
      WHERE game_id = ?
    `, [gameId])
    return rows as any[]
  } catch (error) {
    console.error("Error fetching game details:", error)
    return []
  }
}
