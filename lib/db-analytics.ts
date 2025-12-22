"use server"

import mysql from 'mysql2/promise'

const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'vocabulary_db',
}

export async function getUserEvolution(userId: string) {
    const connection = await mysql.createConnection(dbConfig)
    try {
        // Get last 20 games for evolution graph
        const [rows] = await connection.execute(`
      SELECT 
        DATE_FORMAT(date, '%d/%m %H:%i') as label,
        score,
        total_questions,
        (score / total_questions) * 100 as accuracy
      FROM multiplication_game_results 
      WHERE user_id = ? 
      ORDER BY date ASC 
      LIMIT 20
    `, [userId])
        return rows as any[]
    } finally {
        await connection.end()
    }
}

export async function getUserHeatmap(userId: string) {
    const connection = await mysql.createConnection(dbConfig)
    try {
        // Aggregate results for each multiplication pair
        // We want to know how many times each pair (AxB) was answered correctly vs incorrectly
        // We normalize so 2x3 is the same as 3x2 for the heatmap if desired, but usually tables are taught as "table of 2", so 2x3 and 3x2 might be distinct. 
        // Let's keep them distinct for now as the grid will be 10x10.
        const [rows] = await connection.execute(`
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
    } finally {
        await connection.end()
    }
}

export async function getUserHistory(userId: string) {
    const connection = await mysql.createConnection(dbConfig)
    try {
        const [rows] = await connection.execute(`
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
    } finally {
        await connection.end()
    }
}

export async function getMostFailedQuestions(userId: string, limit: number = 10) {
    const connection = await mysql.createConnection(dbConfig)
    try {
        // Find questions with highest failure rate (min 3 attempts to be significant)
        const [rows] = await connection.execute(`
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
      LIMIT ?
    `, [userId, limit])
        return rows as any[]
    } finally {
        await connection.end()
    }
}
