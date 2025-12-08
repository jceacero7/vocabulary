"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw, Database } from "lucide-react"
import { syncWithDatabase } from "@/lib/db-service"

export default function DatabaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [message, setMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const checkConnection = async () => {
    setIsLoading(true)
    setStatus("checking")
    setMessage("Comprobando conexión a la base de datos...")

    try {
      // Añadir un timeout para evitar que la verificación se quede colgada
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout

      const success = await syncWithDatabase()
      clearTimeout(timeoutId)

      if (success) {
        setStatus("connected")
        setMessage("Conexión establecida correctamente. La base de datos está lista para usar.")
      } else {
        setStatus("error")
        setMessage("No se pudo conectar a la base de datos. Verifica las credenciales y la configuración.")
      }
    } catch (error) {
      setStatus("error")
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessage(
          "La conexión a la base de datos ha excedido el tiempo de espera. Verifica la configuración del servidor.",
        )
      } else {
        setMessage(`Error al conectar: ${error instanceof Error ? error.message : "Error desconocido"}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Estado de la Base de Datos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "checking" && (
          <Alert className="bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
              <AlertDescription className="text-blue-700">Comprobando conexión a la base de datos...</AlertDescription>
            </div>
          </Alert>
        )}

        {status === "connected" && (
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

        <Button onClick={checkConnection} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Comprobando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Comprobar conexión
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
