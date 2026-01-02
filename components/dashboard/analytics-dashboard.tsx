"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw } from "lucide-react"
import EvolutionChart from "./evolution-chart"
import TablesHeatmap from "./tables-heatmap"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getUserEvolution, getUserHeatmap, getUserHistory, getGameDetails } from "@/lib/db-analytics"
import { useAuthStore } from "@/lib/auth-store"

interface AnalyticsDashboardProps {
    onBack: () => void
}

export default function AnalyticsDashboard({ onBack }: AnalyticsDashboardProps) {
    const { user } = useAuthStore()
    const [evolutionData, setEvolutionData] = useState<any[]>([])
    const [heatmapData, setHeatmapData] = useState<any[]>([])
    const [historyData, setHistoryData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedGame, setSelectedGame] = useState<any | null>(null)
    const [gameDetails, setGameDetails] = useState<any[]>([])
    const [isDetailsLoading, setIsDetailsLoading] = useState(false)

    useEffect(() => {
        if (user) {
            loadData()
        }
    }, [user])

    const loadData = async () => {
        if (!user) return
        setIsLoading(true)
        try {
            const [evolution, heatmap, history] = await Promise.all([
                getUserEvolution(user.id),
                getUserHeatmap(user.id),
                getUserHistory(user.id)
            ])
            setEvolutionData(evolution)
            setHeatmapData(heatmap)
            setHistoryData(history)
        } catch (e) {
            console.error("Error loading analytics", e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGameClick = async (game: any) => {
        setSelectedGame(game)
        setIsDetailsLoading(true)
        try {
            const details = await getGameDetails(game.id)
            setGameDetails(details)
        } catch (e) {
            console.error("Error loading game details", e)
        } finally {
            setIsDetailsLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
                <h2 className="text-2xl font-bold text-purple-800">Estadísticas de {user?.name}</h2>
                <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <Tabs defaultValue="evolution" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="evolution">Evolución</TabsTrigger>
                    <TabsTrigger value="heatmap">Mapa de Calor</TabsTrigger>
                    <TabsTrigger value="history">Historial</TabsTrigger>
                </TabsList>

                <TabsContent value="evolution" className="mt-6">
                    <EvolutionChart data={evolutionData} onPointClick={handleGameClick} />
                </TabsContent>

                <TabsContent value="heatmap" className="mt-6">
                    <TablesHeatmap data={heatmapData} />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Últimas Partidas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {historyData.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No hay partidas registradas</p>
                                ) : (
                                    <div className="rounded-md border">
                                        <div className="grid grid-cols-4 bg-gray-50 p-3 font-medium text-sm">
                                            <div>Fecha</div>
                                            <div>Puntuación</div>
                                            <div>Tiempo</div>
                                            <div>Modo</div>
                                        </div>
                                        <div className="divide-y">
                                            {historyData.map((game) => (
                                                <div
                                                    key={game.id}
                                                    className="grid grid-cols-4 p-3 text-sm items-center hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => handleGameClick(game)}
                                                >
                                                    <div>{new Date(game.date).toLocaleDateString()} {new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    <div className="font-bold text-purple-700">
                                                        {game.score}/{game.total_questions}
                                                    </div>
                                                    <div className="text-gray-500">{game.time_used}s</div>
                                                    <div className="capitalize">{game.mode === 'random' ? 'Aleatorio' : 'Secuencial'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={!!selectedGame} onOpenChange={(open) => !open && setSelectedGame(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalles de la Partida</DialogTitle>
                        <DialogDescription>
                            Fecha: {selectedGame && new Date(selectedGame.date).toLocaleString()} |
                            Puntuación: {selectedGame?.score}/{selectedGame?.total_questions}
                        </DialogDescription>
                    </DialogHeader>

                    {isDetailsLoading ? (
                        <div className="flex justify-center py-8">
                            <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {gameDetails.map((detail, index) => {
                                const isUnanswered = detail.user_answer === -1
                                return (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border flex justify-between items-center ${detail.correct
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-red-50 border-red-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${detail.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                {detail.correct ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                )}
                                            </div>
                                            <div className="text-xl font-bold text-gray-800">
                                                {detail.factor_a} × {detail.factor_b}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tu respuesta</div>
                                            <div className={`font-bold text-lg ${detail.correct ? 'text-green-700' : 'text-red-700'}`}>
                                                {isUnanswered ? (
                                                    <span className="italic text-gray-500 text-base">No respondida</span>
                                                ) : (
                                                    detail.user_answer
                                                )}
                                            </div>
                                            {!detail.correct && (
                                                <div className="text-sm font-medium text-green-700 mt-1 bg-green-100 px-2 py-0.5 rounded inline-block">
                                                    Correcta: {detail.factor_a * detail.factor_b}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
