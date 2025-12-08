"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, History, Settings, Database } from "lucide-react"

type GameMenuProps = {
  onStartGame: () => void
  onViewHistory: () => void
  onManageWords: () => void
}

export default function GameMenu({ onStartGame, onViewHistory, onManageWords }: GameMenuProps) {
  return (
    <Card className="bg-white/80 backdrop-blur">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={onStartGame}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-auto py-4"
          >
            <div className="flex flex-col items-center">
              <Play className="h-8 w-8 mb-2" />
              <span className="text-lg font-medium">Jugar</span>
              <span className="text-xs mt-1">Iniciar un nuevo examen</span>
            </div>
          </Button>

          <Button
            onClick={onViewHistory}
            variant="outline"
            className="h-auto py-4 border-purple-200 hover:bg-purple-50"
          >
            <div className="flex flex-col items-center">
              <History className="h-8 w-8 mb-2 text-purple-600" />
              <span className="text-lg font-medium text-purple-700">Historial</span>
              <span className="text-xs mt-1 text-purple-600">Ver exámenes anteriores</span>
            </div>
          </Button>

          <Button
            onClick={onManageWords}
            variant="outline"
            className="h-auto py-4 border-purple-200 hover:bg-purple-50"
          >
            <div className="flex flex-col items-center">
              <Database className="h-8 w-8 mb-2 text-purple-600" />
              <span className="text-lg font-medium text-purple-700">Palabras</span>
              <span className="text-xs mt-1 text-purple-600">Gestionar vocabulario</span>
            </div>
          </Button>

          <Button variant="outline" className="h-auto py-4 border-purple-200 hover:bg-purple-50">
            <div className="flex flex-col items-center">
              <Settings className="h-8 w-8 mb-2 text-purple-600" />
              <span className="text-lg font-medium text-purple-700">Ajustes</span>
              <span className="text-xs mt-1 text-purple-600">Configurar el juego</span>
            </div>
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Aprende vocabulario en inglés de forma divertida. Pon a prueba tus conocimientos con exámenes de 12
            palabras.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
