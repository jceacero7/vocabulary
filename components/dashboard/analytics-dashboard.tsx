"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw } from "lucide-react"
import EvolutionChart from "./evolution-chart"
import TablesHeatmap from "./tables-heatmap"
import { getUserEvolution, getUserHeatmap, getUserHistory } from "@/lib/db-analytics"
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
                    <EvolutionChart data={evolutionData} />
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
                                                <div key={game.id} className="grid grid-cols-4 p-3 text-sm items-center hover:bg-gray-50">
                                                    <div>{new Date(game.date).toLocaleDateString()}</div>
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
        </div>
    )
}
