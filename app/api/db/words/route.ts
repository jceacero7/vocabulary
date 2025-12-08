import { NextResponse } from "next/server"
import { executeQuery } from "../route"
import { v4 as uuidv4 } from "uuid"

// Get all words and categories
export async function GET() {
  try {
    // Get categories
    const categories = await executeQuery(`
      SELECT name FROM categories
      ORDER BY name
    `)

    // Get words with their categories
    const words = await executeQuery(`
      SELECT w.id, w.english, w.spanish, c.name as category
      FROM words w
      LEFT JOIN categories c ON w.category_id = c.id
      ORDER BY w.english
    `)

    return NextResponse.json({
      categories: categories.map((cat: any) => cat.name),
      words,
    })
  } catch (error) {
    console.error("Error fetching words:", error)
    return NextResponse.json({ error: "Failed to fetch words" }, { status: 500 })
  }
}

// Create or update words and categories
export async function POST(request: Request) {
  try {
    const { words, categories } = await request.json()

    // Begin transaction
    await executeQuery("START TRANSACTION")

    // Process categories first
    const categoryIds: Record<string, string> = {}

    for (const categoryName of categories) {
      // Check if category already exists
      const existingCategories = await executeQuery("SELECT id FROM categories WHERE name = ?", [categoryName])

      if (Array.isArray(existingCategories) && existingCategories.length > 0) {
        categoryIds[categoryName] = existingCategories[0].id
      } else {
        // Create new category
        const categoryId = uuidv4()
        await executeQuery("INSERT INTO categories (id, name) VALUES (?, ?)", [categoryId, categoryName])
        categoryIds[categoryName] = categoryId
      }
    }

    // Process words
    for (const word of words) {
      // Get category ID
      const categoryId = word.category ? categoryIds[word.category] : null

      // Check if word already exists
      const existingWords = await executeQuery("SELECT id FROM words WHERE id = ?", [word.id])

      if (Array.isArray(existingWords) && existingWords.length > 0) {
        // Update existing word
        await executeQuery("UPDATE words SET english = ?, spanish = ?, category_id = ? WHERE id = ?", [
          word.english,
          word.spanish,
          categoryId,
          word.id,
        ])
      } else {
        // Insert new word
        await executeQuery("INSERT INTO words (id, english, spanish, category_id) VALUES (?, ?, ?, ?)", [
          word.id,
          word.english,
          word.spanish,
          categoryId,
        ])
      }
    }

    // Commit transaction
    await executeQuery("COMMIT")

    return NextResponse.json({ success: true })
  } catch (error) {
    // Rollback on error
    await executeQuery("ROLLBACK")
    console.error("Error saving words:", error)
    return NextResponse.json({ error: "Failed to save words" }, { status: 500 })
  }
}
