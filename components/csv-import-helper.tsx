"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, CheckCircle, XCircle, FileText } from "lucide-react"
import { useVocabularyStore } from "@/lib/vocabulary-store"

export default function CSVImportHelper() {
  const { importWordsFromCSV } = useVocabularyStore()
  const [status, setStatus] = useState<"idle" | "importing" | "success" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("")
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setFileContent(content)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!fileContent) return

    try {
      setStatus("importing")
      setProgress(0)
      setMessage("Iniciando importación de palabras...")

      // Simular progreso
      setProgress(20)
      setMessage("Analizando archivo CSV...")

      // Pequeña pausa para mostrar el progreso
      await new Promise((resolve) => setTimeout(resolve, 500))

      setProgress(50)
      setMessage("Importando palabras y categorías...")

      // Importar palabras
      const success = await importWordsFromCSV(fileContent)

      if (!success) {
        throw new Error("Error al importar palabras")
      }

      setProgress(100)
      setMessage(`Importación completada con éxito. El vocabulario ha sido actualizado.`)
      setStatus("success")

      // Limpiar el archivo después de importar
      setFileContent(null)
      setFileName("")
    } catch (error) {
      setStatus("error")
      setMessage(`Error durante la importación: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Importar Vocabulario desde CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 space-y-2">
          <p>Puedes importar palabras desde un archivo CSV con el siguiente formato:</p>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono">
            id,english,spanish,category
            <br />
            1,dog,perro,Animales
            <br />
            2,cat,gato,Animales
            <br />
            ...
          </div>
          <p>Las categorías que no existan serán creadas automáticamente.</p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => document.getElementById("csv-file-input")?.click()}
            variant="outline"
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Seleccionar archivo CSV
          </Button>
          <input id="csv-file-input" type="file" accept=".csv" onChange={handleFileChange} className="hidden" />

          {fileName && <div className="text-sm text-gray-600 truncate flex-1">{fileName}</div>}
        </div>

        {status === "importing" && (
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
        <Button onClick={handleImport} disabled={!fileContent || status === "importing"} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Importar palabras
        </Button>
      </CardFooter>
    </Card>
  )
}
