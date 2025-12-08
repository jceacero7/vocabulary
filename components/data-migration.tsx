"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ArrowUpFromLine, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { useVocabularyStore } from "@/lib/vocabulary-store"
import { useUserStore } from "@/lib/user-store"
import { saveUsers, saveWords, saveGameResult } from "@/lib/db-service"

export default function DataMigration() {
  const { words, categories, gameHistory } = useVocabularyStore()
  const { users } = useUserStore()
  const [status, setStatus] = useState<"idle" | "migrating" | "success" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("")

  const migrateData = async () => {
    try {
      setStatus("migrating")
      setProgress(0)
      setMessage("Iniciando migración de datos...")

      // Step 1: Migrate users
      setMessage("Migrando usuarios...")
      setProgress(20)
      const usersSuccess = await saveUsers(users)
      if (!usersSuccess) throw new Error("Error al migrar usuarios")

      // Step 2: Migrate words and categories
      setMessage("Migrando palabras y categorías...")
      setProgress(40)
      const wordsSuccess = await saveWords(words, categories)
      if (!wordsSuccess) throw new Error("Error al migrar palabras y categorías")

      // Step 3: Migrate game history
      setMessage("Migrando historial de juegos...")
      setProgress(60)

      // Migrate each game result individually
      for (let i = 0; i < gameHistory.length; i++) {
        const result = gameHistory[i]
        const gameSuccess = await saveGameResult(result)
        if (!gameSuccess) throw new Error(`Error al migrar juego #${i + 1}`)

        // Update progress for each game
        const gameProgress = Math.floor(60 + (i / gameHistory.length) * 30)
        setProgress(gameProgress)
      }

      // Success
      setProgress(100)
      setMessage("Migración completada con éxito. Todos los datos han sido transferidos a la base de datos MySQL.")
      setStatus("success")
    } catch (error) {
      setStatus("error")
      setMessage(`Error durante la migración: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpFromLine className="h-5 w-5" />
          Migración de Datos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 space-y-2">
          <p>Esta herramienta te permite migrar todos los datos almacenados localmente a la base de datos MySQL:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{users.length} usuarios</li>
            <li>{words.length} palabras</li>
            <li>{categories.length} categorías</li>
            <li>{gameHistory.length} registros de juego</li>
          </ul>
        </div>

        {status === "migrating" && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-blue-600">{message}</p>
          </div>
        )}

        {status === "success" && (
          <Alert className="bg-green-50 border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">{message}</AlertDescription>
            </div>
          </Alert>
        )}

        {status === "error" && (
          <Alert className="bg-red-50 border-red-200">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">{message}</AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={migrateData} disabled={status === "migrating" || users.length === 0} className="w-full">
          {status === "migrating" ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Migrando datos...
            </>
          ) : (
            <>
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Migrar datos a MySQL
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
