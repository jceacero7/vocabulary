"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface TablesHeatmapProps {
    data: any[]
}

export default function TablesHeatmap({ data }: TablesHeatmapProps) {
    // Process data into a map for easy lookup
    // Key: "AxB", Value: { correct: number, incorrect: number }
    const statsMap = new Map<string, { correct: number, incorrect: number }>()

    data.forEach(item => {
        statsMap.set(`${item.factor_a}x${item.factor_b}`, {
            correct: Number(item.correct_count),
            incorrect: Number(item.incorrect_count)
        })
    })

    const getCellColor = (a: number, b: number) => {
        const stats = statsMap.get(`${a}x${b}`)
        if (!stats) return "bg-gray-100 text-gray-300" // No data

        const total = stats.correct + stats.incorrect
        if (total === 0) return "bg-gray-100 text-gray-300"

        const accuracy = stats.correct / total

        // Gradient from Red (0%) to Green (100%)
        if (accuracy >= 0.9) return "bg-green-500 text-white"
        if (accuracy >= 0.7) return "bg-green-300 text-green-900"
        if (accuracy >= 0.5) return "bg-yellow-200 text-yellow-900"
        if (accuracy >= 0.3) return "bg-orange-300 text-orange-900"
        return "bg-red-500 text-white"
    }

    const getTooltipText = (a: number, b: number) => {
        const stats = statsMap.get(`${a}x${b}`)
        if (!stats) return "Sin datos"
        const total = stats.correct + stats.incorrect
        const accuracy = Math.round((stats.correct / total) * 100)
        return `${stats.correct} aciertos, ${stats.incorrect} fallos (${accuracy}%)`
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mapa de Calor</CardTitle>
                <p className="text-sm text-gray-500">Rojo = Necesita práctica, Verde = Dominado</p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-11 gap-1 w-full max-w-[500px] mx-auto">
                    {/* Header Row */}
                    <div className="h-8 w-8"></div>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                        <div key={`h-${num}`} className="h-8 w-8 flex items-center justify-center font-bold text-gray-500">
                            {num}
                        </div>
                    ))}

                    {/* Rows */}
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(row => (
                        <>
                            {/* Row Label */}
                            <div key={`v-${row}`} className="h-8 w-8 flex items-center justify-center font-bold text-gray-500">
                                {row}
                            </div>
                            {/* Cells */}
                            {Array.from({ length: 10 }, (_, j) => j + 1).map(col => (
                                <TooltipProvider key={`${row}x${col}`}>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <div
                                                className={cn(
                                                    "h-8 w-8 flex items-center justify-center rounded text-xs font-medium cursor-help transition-colors",
                                                    getCellColor(row, col)
                                                )}
                                            >
                                                {row * col}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="font-bold">{row} x {col}</p>
                                            <p className="text-xs">{getTooltipText(row, col)}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
