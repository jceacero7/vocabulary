import { NextResponse } from "next/server"
import { executeQuery } from "../route"
import { v4 as uuidv4 } from "uuid"

// Get game history for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get game results
    const gameResults = await executeQuery(
      `
      SELECT 
        g.id, 
        g.user_id as userId, 
        g.date, 
        g.score, 
        g.total_words as totalWords, 
        g.time_used as timeUsed
      FROM game_results g
      WHERE g.user_id = ?
      ORDER BY g.date DESC
    `,
      [userId],
    )

    // For each game, get word results and categories
    const gameHistory = await Promise.all(
      gameResults.map(async (game: any) => {
        // Get word results
        const wordResults = await executeQuery(
          `
          SELECT 
            spanish, 
            english, 
            user_answer as userAnswer, 
            correct, 
            time_used as timeUsed
          FROM word_results
          WHERE game_id = ?
        `,
          [game.id],
        )

        // Get categories
        const categories = await executeQuery(
          `
          SELECT c.name
          FROM game_categories gc
          JOIN categories c ON gc.category_id = c.id
          WHERE gc.game_id = ?
        `,
          [game.id],
        )

        return {
          ...game,
          wordResults,
          categories: categories.map((cat: any) => cat.name),
        }
      }),
    )

    return NextResponse.json({ gameHistory })
  } catch (error) {
    console.error("Error fetching game history:", error)
    return NextResponse.json({ error: "Failed to fetch game history" }, { status: 500 })
  }
}

// Save a game result
export async function POST(request: Request) {
  try {
    const { result } = await request.json()

    // Begin transaction
    await executeQuery("START TRANSACTION")

    // Insert game result
    const gameId = result.id || uuidv4()
    await executeQuery(
      `
      INSERT INTO game_results (id, user_id, date, score, total_words, time_used)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [gameId, result.userId, new Date(result.date), result.score, result.totalWords, result.timeUsed],
    )

    // Insert word results
    for (const wordResult of result.wordResults) {
      const wordResultId = uuidv4()
      await executeQuery(
        `
        INSERT INTO word_results (id, game_id, spanish, english, user_answer, correct, time_used)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          wordResultId,
          gameId,
          wordResult.spanish,
          wordResult.english,
          wordResult.userAnswer,
          wordResult.correct ? 1 : 0,
          wordResult.timeUsed,
        ],
      )
    }

    // Insert game categories
    if (result.categories && result.categories.length > 0) {
      // Get category IDs
      for (const categoryName of result.categories) {
        // Find category ID
        const categories = await executeQuery("SELECT id FROM categories WHERE name = ?", [categoryName])

        if (Array.isArray(categories) && categories.length > 0) {
          const categoryId = categories[0].id

          // Insert game-category relationship
          await executeQuery(
            `
            INSERT INTO game_categories (game_id, category_id)
            VALUES (?, ?)
          `,
            [gameId, categoryId],
          )
        }
      }
    }

    // Commit transaction
    await executeQuery("COMMIT")

    return NextResponse.json({ success: true })
  } catch (error) {
    // Rollback on error
    await executeQuery("ROLLBACK")
    console.error("Error saving game result:", error)
    return NextResponse.json({ error: "Failed to save game result" }, { status: 500 })
  }
}
