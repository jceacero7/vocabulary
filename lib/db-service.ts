import type { User } from "./user-store"
import type { GameResult } from "./vocabulary-store"

// Types for database operations
type Word = {
  id: string
  english: string
  spanish: string
  category: string
}

// Función para verificar si la base de datos está disponible
export async function isDatabaseAvailable() {
  try {
    // Intentar hacer una petición simple para verificar la conexión
    const response = await fetch("/api/db", {
      method: "GET",
    })
    return response.ok
  } catch (error) {
    console.error("Database connection check error:", error)
    return false
  }
}

// Función para sincronizar con la base de datos
export async function syncWithDatabase() {
  try {
    // Primero, verificar si las variables de entorno están disponibles
    if (
      !process.env.MYSQL_HOST ||
      !process.env.MYSQL_USER ||
      !process.env.MYSQL_PASSWORD ||
      !process.env.MYSQL_DATABASE
    ) {
      console.warn("MySQL environment variables are not configured")
      return false
    }

    // Intentar inicializar la base de datos con un timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

    const initResponse = await fetch("/api/db", {
      method: "GET",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!initResponse.ok) {
      return false
    }

    return true
  } catch (error) {
    console.error("Database sync error:", error)
    return false
  }
}

// User operations
export async function saveUsers(users: User[]) {
  try {
    const response = await fetch("/api/db/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ users }),
    })

    if (!response.ok) {
      throw new Error("Failed to save users")
    }

    return true
  } catch (error) {
    console.error("Save users error:", error)
    return false
  }
}

export async function loadUsers(): Promise<User[]> {
  try {
    const response = await fetch("/api/db/users")

    if (!response.ok) {
      throw new Error("Failed to load users")
    }

    const data = await response.json()
    return data.users
  } catch (error) {
    console.error("Load users error:", error)
    return []
  }
}

// Words and categories operations
export async function saveWords(words: Word[], categories: string[]) {
  try {
    const response = await fetch("/api/db/words", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ words, categories }),
    })

    if (!response.ok) {
      throw new Error("Failed to save words and categories")
    }

    return true
  } catch (error) {
    console.error("Save words error:", error)
    return false
  }
}

export async function loadWords(): Promise<{ words: Word[]; categories: string[] }> {
  try {
    const response = await fetch("/api/db/words")

    if (!response.ok) {
      throw new Error("Failed to load words and categories")
    }

    const data = await response.json()
    return {
      words: data.words,
      categories: data.categories,
    }
  } catch (error) {
    console.error("Load words error:", error)
    return { words: [], categories: [] }
  }
}

// Game history operations
export async function saveGameResult(result: GameResult) {
  try {
    const response = await fetch("/api/db/games", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ result }),
    })

    if (!response.ok) {
      throw new Error("Failed to save game result")
    }

    return true
  } catch (error) {
    console.error("Save game result error:", error)
    return false
  }
}

export async function loadGameHistory(userId: string): Promise<GameResult[]> {
  try {
    const response = await fetch(`/api/db/games?userId=${userId}`)

    if (!response.ok) {
      throw new Error("Failed to load game history")
    }

    const data = await response.json()
    return data.gameHistory
  } catch (error) {
    console.error("Load game history error:", error)
    return []
  }
}
