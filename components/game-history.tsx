"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, BarChart2, Search, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, X } from "lucide-react"
import type { WordResult } from "./vocabulary-game"

type GameResult = {
  id: string
  date: string
  score: number
  totalWords: number
  timeUsed: number
  wordResults?: WordResult[]
  categories?: string[]
}

type GameHistoryProps = {
  history: GameResult[]
}

export default function GameHistory({ history }: GameHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGame, setSelectedGame] = useState<GameResult | null>(null)

  // Calculate average score
  const averageScore =
    history.length > 0
      ? ((history.reduce((sum, game) => sum + game.score / game.totalWords, 0) / history.length) * 100).toFixed(1)
      : "0"

  // Calculate average time per word
  const averageTimePerWord =
    history.length > 0
      ? (history.reduce((sum, game) => sum + game.timeUsed / game.totalWords, 0) / history.length).toFixed(1)
      : "0"

  // Filter history based on search term
  const filteredHistory = history.filter((game) => {
    const matchesDate = game.date.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategories = game.categories?.some((cat) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesDate || matchesCategories
  })

  return (
    <Card className="bg-white/80 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg md:text-xl text-purple-700 flex items-center">
            <BarChart2 className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            Historial de exámenes
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-purple-100 p-3 rounded-lg text-center">
            <p className="text-xs md:text-sm text-purple-700">Puntuación media</p>
            <p className="text-lg md:text-xl font-bold text-purple-800">{averageScore}%</p>
          </div>
          <div className="bg-pink-100 p-3 rounded-lg text-center">
            <p className="text-xs md:text-sm text-pink-700">Tiempo medio por palabra</p>
            <p className="text-lg md:text-xl font-bold text-pink-800">{averageTimePerWord}s</p>
          </div>
        </div>

        {isExpanded && (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por fecha o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2 text-xs md:text-sm font-medium text-gray-600 pb-1 border-b">
                <div>Fecha</div>
                <div>Puntuación</div>
                <div>Palabras</div>
                <div>Tiempo</div>
                <div>Categorías</div>
              </div>

              {filteredHistory.length > 0 ? (
                filteredHistory.map((game, index) => (
                  <div
                    key={game.id}
                    className="grid grid-cols-5 gap-2 text-xs md:text-sm py-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedGame(game)}
                  >
                    <div className="text-gray-600 truncate">{game.date}</div>
                    <div className="font-medium">
                      {game.score}/{game.totalWords}
                    </div>
                    <div>{game.totalWords}</div>
                    <div>{game.timeUsed}s</div>
                    <div className="flex flex-wrap gap-1">
                      {game.categories && game.categories.length > 0 ? (
                        game.categories.length > 1 ? (
                          <>
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {game.categories[0]}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              +{game.categories.length - 1}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {game.categories[0]}
                          </Badge>
                        )
                      ) : (
                        <span className="text-gray-400">Todas</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">No se encontraron resultados</div>
              )}
            </div>
          </>
        )}

        {/* Game Details Dialog */}
        <Dialog open={!!selectedGame} onOpenChange={(open) => !open && setSelectedGame(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalles del examen - {selectedGame?.date}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-100 p-3 rounded-lg text-center">
                  <p className="text-xs text-purple-700">Puntuación</p>
                  <p className="text-lg font-bold text-purple-800">
                    {selectedGame?.score}/{selectedGame?.totalWords}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg text-center">
                  <p className="text-xs text-blue-700">Tiempo total</p>
                  <p className="text-lg font-bold text-blue-800">{selectedGame?.timeUsed}s</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg text-center">
                  <p className="text-xs text-green-700">Tiempo por palabra</p>
                  <p className="text-lg font-bold text-green-800">
                    {selectedGame ? (selectedGame.timeUsed / selectedGame.totalWords).toFixed(1) : 0}s
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-medium">Categorías:</h3>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedGame?.categories && selectedGame.categories.length > 0 ? (
                    selectedGame.categories.map((category, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">Todas las categorías</span>
                  )}
                </div>
              </div>

              {selectedGame?.wordResults && selectedGame.wordResults.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-700">Español</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-700">Inglés</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-700">Tu respuesta</th>
                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-700">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedGame.wordResults.map((result, index) => (
                        <tr key={index} className={result.correct ? "bg-green-50" : "bg-red-50"}>
                          <td className="py-2 px-3 text-xs">{result.spanish}</td>
                          <td className="py-2 px-3 text-xs font-medium">{result.english}</td>
                          <td className="py-2 px-3 text-xs">
                            {result.userAnswer || <span className="text-gray-400">(sin respuesta)</span>}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {result.correct ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                                <Check className="h-3 w-3 text-green-600" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100">
                                <X className="h-3 w-3 text-red-600" />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
