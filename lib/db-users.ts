"use server"

import mysql from 'mysql2/promise'
import { v4 as uuidv4 } from 'uuid';

const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'vocabulary_db',
}

export async function getUsers() {
    console.log("DB: getUsers called")
    const connection = await mysql.createConnection(dbConfig)
    try {
        console.log("DB: connection created")
        const [rows] = await connection.execute('SELECT id, name, avatar FROM users ORDER BY name')
        console.log("DB: query executed, rows:", rows)
        return rows as any[]
    } catch (e) {
        console.error("DB: error in getUsers", e)
        throw e
    } finally {
        await connection.end()
    }
}

export async function verifyUser(userId: string, passwordInput: string) {
    const connection = await mysql.createConnection(dbConfig)
    try {
        const [rows] = await connection.execute(
            'SELECT id, name, password FROM users WHERE id = ?',
            [userId]
        )
        const users = rows as any[]
        if (users.length === 0) return false

        // Simple comparison for now as requested (plaintext/simple hash if we were advanced, but user asked for simple)
        // In a real app we would use bcrypt. For this child's app, direct comparison is fine as per "1234" example.
        return users[0].password === passwordInput
    } finally {
        await connection.end()
    }
}

export async function createUser(name: string, password: string) {
    const connection = await mysql.createConnection(dbConfig)
    try {
        const id = uuidv4()
        await connection.execute(
            'INSERT INTO users (id, name, password) VALUES (?, ?, ?)',
            [id, name, password]
        )
        return { id, name }
    } finally {
        await connection.end()
    }
}
