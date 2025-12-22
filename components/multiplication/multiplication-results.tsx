"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trophy, Clock, XCircle, CheckCircle, RotateCcw, Home } from "lucide-react"
import type { MultiplicationProblemResult } from "@/types/multiplication"

interface MultiplicationResultsProps {
    results: MultiplicationProblemResult[]
    score: number
    totalTime: number
    onPlayAgain: () => void
    onMenu: () => void
}

export default function MultiplicationResults({
    results,
    score,
    totalTime,
    onPlayAgain,
    onMenu
}: MultiplicationResultsProps) {
    const totalQuestions = results.length
    const percentage = Math.round((score / totalQuestions) * 100)

    const getMessage = () => {
        if (percentage === 100) return "¡Increíble! ¡Eres un genio de las matemáticas!"
        if (percentage >= 80) return "¡Excelente trabajo! Casi perfecto."
        if (percentage >= 60) return "¡Bien hecho! Sigue practicando."
        return "¡Sigue intentándolo! Tú puedes mejorar."
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-purple-200 overflow-hidden">
                <div className="bg-purple-600 p-6 text-center text-white">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
                    <h2 className="text-3xl font-bold mb-2">{getMessage()}</h2>
                    <div className="flex justify-center gap-8 mt-6">
                        <div className="text-center">
                            <p className="text-purple-200 text-sm uppercase tracking-wider font-semibold">Puntuación</p>
                            <p className="text-4xl font-bold">{score}/{totalQuestions}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-purple-200 text-sm uppercase tracking-wider font-semibold">Tiempo</p>
                            <p className="text-4xl font-bold">{formatTime(totalTime)}</p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6 space-y-6">
                    {/* Mistakes Review */}
                    {score < totalQuestions && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-500" />
                                Repasemos los errores:
                            </h3>
                            <ScrollArea className="h-48 rounded-md border p-4 bg-gray-50">
                                <div className="space-y-3">
                                    {results.filter(r => !r.correct).map((result) => (
                                        <div key={result.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-lg font-bold text-gray-700">
                                                    {result.factorA} × {result.factorB}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="text-red-500">
                                                    Tu respuesta: <span className="font-bold">{result.userAnswer}</span>
                                                </div>
                                                <div className="text-green-600">
                                                    Correcta: <span className="font-bold">{result.factorA * result.factorB}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Button
                            variant="outline"
                            onClick={onMenu}
                            className="flex-1 h-12 text-lg border-gray-300"
                        >
                            <Home className="mr-2 h-5 w-5" /> Menú Principal
                        </Button>
                        <Button
                            onClick={onPlayAgain}
                            className="flex-1 h-12 text-lg bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                        >
                            <RotateCcw className="mr-2 h-5 w-5" /> Jugar de Nuevo
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
