"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Play, Check, BarChart3, BrainCircuit } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiplicationMenuProps {
    onStart: (selectedTables: number[], mode: "random" | "sequential", variant: "standard" | "guess_multiplier") => void
    onBack: () => void
    onDashboard: () => void
    onPracticeWeaknesses: () => void
}

export default function MultiplicationMenu({ onStart, onBack, onDashboard, onPracticeWeaknesses }: MultiplicationMenuProps) {
    const [selectedTables, setSelectedTables] = useState<number[]>([])
    const [isRandom, setIsRandom] = useState(true)
    const [isGuessMultiplier, setIsGuessMultiplier] = useState(false)

    const toggleTable = (num: number) => {
        setSelectedTables((prev) =>
            prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort((a, b) => a - b)
        )
    }

    const selectAll = () => {
        if (selectedTables.length === 10) {
            setSelectedTables([])
        } else {
            setSelectedTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        }
    }

    const handleStart = () => {
        if (selectedTables.length > 0) {
            onStart(selectedTables, isRandom ? "random" : "sequential", isGuessMultiplier ? "guess_multiplier" : "standard")
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto bg-white/90 backdrop-blur-sm shadow-xl border-purple-200">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-3xl font-bold text-purple-700">Configura tu Examen</CardTitle>
                <p className="text-gray-600">Elige las tablas que quieres practicar</p>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Extra Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        className="h-14 sm:h-12 border-purple-200 hover:bg-purple-50 hover:text-purple-700 text-lg sm:text-base"
                        onClick={onDashboard}
                    >
                        <BarChart3 className="mr-2 h-5 w-5 sm:h-4 sm:w-4" /> Estadísticas
                    </Button>
                    <Button
                        variant="outline"
                        className="h-14 sm:h-12 border-pink-200 hover:bg-pink-50 hover:text-pink-700 text-lg sm:text-base"
                        onClick={onPracticeWeaknesses}
                    >
                        <BrainCircuit className="mr-2 h-5 w-5 sm:h-4 sm:w-4" /> Practicar Fallos
                    </Button>
                </div>

                {/* Table Selection Grid */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label className="text-lg font-semibold text-purple-800">Tablas de Multiplicar</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={selectAll}
                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                        >
                            {selectedTables.length === 10 ? "Deseleccionar todas" : "Seleccionar todas"}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <button
                                key={num}
                                onClick={() => toggleTable(num)}
                                className={cn(
                                    "h-20 sm:h-16 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 active:scale-95 touch-manipulation",
                                    selectedTables.includes(num)
                                        ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md scale-105"
                                        : "border-gray-200 hover:border-purple-300 hover:bg-gray-50 text-gray-600"
                                )}
                            >
                                <span className="text-3xl sm:text-2xl font-bold">{num}</span>
                                {selectedTables.includes(num) && (
                                    <Badge variant="secondary" className="bg-purple-200 text-purple-700 text-[10px] h-4 px-1">
                                        <Check className="w-3 h-3 mr-0.5" /> Seleccionada
                                    </Badge>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mode Selection */}
                <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1">
                            <Label className="text-base font-semibold text-purple-800">Modo Aleatorio</Label>
                            <p className="text-sm text-gray-600">
                                {isRandom
                                    ? "Las preguntas aparecerán en orden mezclado"
                                    : "Las preguntas seguirán el orden de las tablas (1x1, 1x2...)"}
                            </p>
                        </div>
                        <Switch
                            checked={isRandom}
                            onCheckedChange={setIsRandom}
                            className="data-[state=checked]:bg-purple-600"
                        />
                    </div>

                    {/* Guess Multiplier Mode Selection */}
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1">
                            <Label className="text-base font-semibold text-purple-800">Adivinar Multiplicador</Label>
                            <p className="text-sm text-gray-600">
                                {isGuessMultiplier
                                    ? "Adivina el número que falta (ej: 3 x ? = 15)"
                                    : "Modo clásico: adivina el resultado (ej: 3 x 5 = ?)"}
                            </p>
                        </div>
                        <Switch
                            checked={isGuessMultiplier}
                            onCheckedChange={setIsGuessMultiplier}
                            className="data-[state=checked]:bg-purple-600"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                        variant="outline"
                        onClick={onBack}
                        className="w-full sm:w-1/3 border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                        Volver
                    </Button>
                    <Button
                        onClick={handleStart}
                        disabled={selectedTables.length === 0}
                        className={cn(
                            "w-full sm:w-2/3 text-lg py-6 shadow-lg transition-all",
                            selectedTables.length > 0
                                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-[1.02]"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        <Play className="mr-2 h-5 w-5" />
                        ¡Empezar Examen!
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
