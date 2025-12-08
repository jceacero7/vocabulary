import { NextResponse } from "next/server"
import { executeQuery } from "../route"

// Get all users
export async function GET() {
  try {
    const users = await executeQuery(`
      SELECT id, name, avatar, created_at as createdAt
      FROM users
      ORDER BY created_at DESC
    `)

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

// Create or update users
export async function POST(request: Request) {
  try {
    const { users } = await request.json()

    // Begin transaction
    await executeQuery("START TRANSACTION")

    for (const user of users) {
      // Check if user already exists
      const existingUsers = await executeQuery("SELECT id FROM users WHERE id = ?", [user.id])

      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        // Update existing user
        await executeQuery("UPDATE users SET name = ?, avatar = ? WHERE id = ?", [
          user.name,
          user.avatar || null,
          user.id,
        ])
      } else {
        // Insert new user
        await executeQuery("INSERT INTO users (id, name, avatar, created_at) VALUES (?, ?, ?, ?)", [
          user.id,
          user.name,
          user.avatar || null,
          new Date(user.createdAt),
        ])
      }
    }

    // Commit transaction
    await executeQuery("COMMIT")

    return NextResponse.json({ success: true })
  } catch (error) {
    // Rollback on error
    await executeQuery("ROLLBACK")
    console.error("Error saving users:", error)
    return NextResponse.json({ error: "Failed to save users" }, { status: 500 })
  }
}

// Delete a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    await executeQuery("DELETE FROM users WHERE id = ?", [userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
