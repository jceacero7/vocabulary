"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Send, X, Volume2, HelpCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import { v4 as uuidv4 } from 'uuid';
import type { MultiplicationProblemResult } from "@/types/multiplication"

// Tipos para Web Speech API
interface IWindow extends Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
}

interface MultiplicationChallengeProps {
    tables: number[]
    mode: "random" | "sequential"
    variant?: "standard" | "guess_multiplier"
    initialQuestions?: Question[]
    initialStats?: any[]
    onComplete: (results: MultiplicationProblemResult[], score: number, timeUsed: number) => void
    onCancel: () => void
}

type Question = {
    factorA: number
    factorB: number
    answer: number
}

type Level = "mastered" | "advanced" | "intermediate" | "beginner" | "novice"

export default function MultiplicationChallenge({ tables, mode, variant = "standard", initialQuestions, initialStats, onComplete, onCancel }: MultiplicationChallengeProps) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userInput, setUserInput] = useState("")
    const [isListening, setIsListening] = useState(false)
    const [feedback, setFeedback] = useState<"none" | "correct" | "incorrect" | "timeout">("none")
    const [results, setResults] = useState<MultiplicationProblemResult[]>([])
    const [startTime, setStartTime] = useState(Date.now())
    const [questionStartTime, setQuestionStartTime] = useState(Date.now())
    const [timeLeft, setTimeLeft] = useState(20)

    // Gamification state
    const [localStats, setLocalStats] = useState<Map<string, { correct: number, incorrect: number }>>(new Map())
    const [levelUp, setLevelUp] = useState<{ type: "level-up" | "mastered", from: Level, to: Level } | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)
    const recognitionRef = useRef<any>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Initialize stats map
    useEffect(() => {
        if (initialStats) {
            const map = new Map()
            initialStats.forEach(stat => {
                map.set(`${stat.factor_a}x${stat.factor_b}`, {
                    correct: Number(stat.correct_count),
                    incorrect: Number(stat.incorrect_count)
                })
            })
            setLocalStats(map)
        }
    }, [initialStats])

    // ... (useEffect for questions initialization remains the same)
    useEffect(() => {
        if (initialQuestions && initialQuestions.length > 0) {
            setQuestions(initialQuestions)
            setStartTime(Date.now())
            setQuestionStartTime(Date.now())
            return
        }

        const newQuestions: Question[] = []

        if (mode === "sequential") {
            tables.forEach(table => {
                for (let i = 1; i <= 10; i++) {
                    newQuestions.push({ factorA: table, factorB: i, answer: table * i })
                }
            })
        } else {
            // Random mode: generate 10 questions from selected tables
            for (let i = 0; i < 10; i++) {
                const table = tables[Math.floor(Math.random() * tables.length)]
                const multiplier = Math.floor(Math.random() * 10) + 1
                newQuestions.push({ factorA: table, factorB: multiplier, answer: table * multiplier })
            }
        }

        setQuestions(newQuestions)
        setStartTime(Date.now())
        setQuestionStartTime(Date.now())
    }, [tables, mode, initialQuestions])

    // ... (Timer logic remains the same)
    useEffect(() => {
        if (questions.length === 0) return
        if (feedback !== "none") {
            if (timerRef.current) clearInterval(timerRef.current)
            return
        }
        setTimeLeft(20)
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current)
                    handleTimeout()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [currentIndex, feedback, questions])

    // ... (Focus input logic remains the same)
    useEffect(() => {
        if (feedback === "none" && inputRef.current) {
            inputRef.current.focus()
        }
    }, [currentIndex, feedback])

    // ... (Speech recognition logic remains the same)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow
            const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition

            if (SpeechRecognitionConstructor) {
                const recognition = new SpeechRecognitionConstructor()
                recognition.continuous = false
                recognition.interimResults = false
                recognition.lang = "es-ES"

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript
                    const number = parseInt(transcript.replace(/\D/g, "")) // Extraer solo números

                    if (!isNaN(number)) {
                        setUserInput(number.toString())
                        handleAnswer(number.toString())
                    }
                    setIsListening(false)
                }

                recognition.onerror = () => {
                    setIsListening(false)
                }

                recognition.onend = () => {
                    setIsListening(false)
                }

                recognitionRef.current = recognition
            }
        }
    }, [])

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop()
            setIsListening(false)
        } else {
            setUserInput("")
            recognitionRef.current?.start()
            setIsListening(true)
        }
    }

    const playAudio = (type: "correct" | "incorrect" | "levelup" | "correct2") => {
        const audio = new Audio(`/sounds/${type}.mp3`)
        audio.volume = 0.5
        audio.play().catch(e => console.error("Error playing sound:", e))
    }

    const speakQuestion = (question: Question) => {
        // Don't speak in guess_multiplier mode as it reveals the answer (the multiplier)
        if (variant === "guess_multiplier") return

        if (typeof window !== "undefined" && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            const text = `${question.factorA} por ${question.factorB}`
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = 'es-ES'
            utterance.rate = 0.9
            utterance.pitch = 1.1
            window.speechSynthesis.speak(utterance)
        }
    }

    // ... (Speak question effect remains the same)
    useEffect(() => {
        if (questions.length > 0 && feedback === "none") {
            const timer = setTimeout(() => {
                speakQuestion(questions[currentIndex])
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [currentIndex, questions, feedback])

    const getLevel = (correct: number, incorrect: number): Level => {
        const total = correct + incorrect
        if (total === 0) return "novice"
        const accuracy = correct / total

        if (accuracy >= 0.9) return "mastered"
        if (accuracy >= 0.7) return "advanced"
        if (accuracy >= 0.5) return "intermediate"
        if (accuracy >= 0.3) return "beginner"
        return "novice"
    }

    const getLevelColor = (level: Level) => {
        switch (level) {
            case "mastered": return "bg-green-500 text-white border-green-600"
            case "advanced": return "bg-green-300 text-green-900 border-green-400"
            case "intermediate": return "bg-yellow-200 text-yellow-900 border-yellow-400"
            case "beginner": return "bg-orange-300 text-orange-900 border-orange-400"
            case "novice": return "bg-red-500 text-white border-red-600"
        }
    }

    const getLevelName = (level: Level) => {
        switch (level) {
            case "mastered": return "¡Dominado!"
            case "advanced": return "Avanzado"
            case "intermediate": return "Intermedio"
            case "beginner": return "Principiante"
            case "novice": return "Novato"
        }
    }

    const handleTimeout = () => {
        const currentQuestion = questions[currentIndex]
        const timeUsed = 20

        // Update stats for timeout (counts as incorrect)
        const key = `${currentQuestion.factorA}x${currentQuestion.factorB}`
        const currentStats = localStats.get(key) || { correct: 0, incorrect: 0 }
        const newStats = { ...currentStats, incorrect: currentStats.incorrect + 1 }
        localStats.set(key, newStats)
        setLocalStats(new Map(localStats))

        const newResult: MultiplicationProblemResult = {
            id: uuidv4(),
            gameId: "",
            factorA: currentQuestion.factorA,
            factorB: currentQuestion.factorB,
            userAnswer: -1,
            correct: false,
            timeUsed
        }

        const newResults = [...results, newResult]
        setResults(newResults)
        setFeedback("timeout")
    }

    const handleAnswer = (input: string) => {
        if (feedback !== "none") return

        const numInput = parseInt(input)
        if (isNaN(numInput)) return

        const currentQuestion = questions[currentIndex]
        let isCorrect = false

        if (variant === "guess_multiplier") {
            isCorrect = numInput === currentQuestion.factorB
        } else {
            isCorrect = numInput === currentQuestion.answer
        }
        const timeUsed = Math.floor((Date.now() - questionStartTime) / 1000)

        // Gamification Logic
        const key = `${currentQuestion.factorA}x${currentQuestion.factorB}`
        const currentStats = localStats.get(key) || { correct: 0, incorrect: 0 }
        const oldLevel = getLevel(currentStats.correct, currentStats.incorrect)

        const newStats = {
            correct: currentStats.correct + (isCorrect ? 1 : 0),
            incorrect: currentStats.incorrect + (isCorrect ? 0 : 1)
        }
        localStats.set(key, newStats)
        setLocalStats(new Map(localStats))

        const newLevel = getLevel(newStats.correct, newStats.incorrect)

        // Check for level up
        if (isCorrect && newLevel !== oldLevel) {
            const levels = ["novice", "beginner", "intermediate", "advanced", "mastered"]
            if (levels.indexOf(newLevel) > levels.indexOf(oldLevel)) {
                if (newLevel === "mastered") {
                    setLevelUp({ type: "mastered", from: oldLevel, to: newLevel })
                } else {
                    setLevelUp({ type: "level-up", from: oldLevel, to: newLevel })
                }
            }
        } else {
            setLevelUp(null)
        }

        const newResult: MultiplicationProblemResult = {
            id: uuidv4(),
            gameId: "",
            factorA: currentQuestion.factorA,
            factorB: currentQuestion.factorB,
            userAnswer: numInput,
            correct: isCorrect,
            timeUsed,
            levelBefore: oldLevel,
            levelAfter: newLevel
        }

        const newResults = [...results, newResult]
        setResults(newResults)

        if (isCorrect) {
            setFeedback("correct")
            if (newLevel === "mastered" && oldLevel !== "mastered") {
                playAudio("levelup") // Use levelup sound for mastery too for now or add specific sound
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#22c55e', '#fbbf24', '#ffffff']
                })
            } else if (newLevel !== oldLevel && ["novice", "beginner", "intermediate", "advanced", "mastered"].indexOf(newLevel) > ["novice", "beginner", "intermediate", "advanced", "mastered"].indexOf(oldLevel)) {
                playAudio("levelup")
                confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.7 },
                    colors: ['#60a5fa', '#34d399', '#ffffff']
                })
            } else {
                playAudio(variant === "guess_multiplier" ? "correct2" : "correct")
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.7 },
                    colors: ['#a855f7', '#ec4899', '#ffffff']
                })
            }

            setTimeout(() => {
                if (currentIndex < questions.length - 1) {
                    setCurrentIndex(prev => prev + 1)
                    setQuestionStartTime(Date.now())
                    setFeedback("none")
                    setLevelUp(null)
                    setUserInput("")
                } else {
                    const totalTime = Math.floor((Date.now() - startTime) / 1000)
                    const score = newResults.filter(r => r.correct).length
                    onComplete(newResults, score, totalTime)
                }
            }, 2000) // Increased delay to show level up feedback
        } else {
            setFeedback("incorrect")
            playAudio("incorrect")
            setLevelUp(null)
        }
    }

    if (questions.length === 0) return <div>Cargando...</div>

    const currentQuestion = questions[currentIndex]
    const currentKey = `${currentQuestion.factorA}x${currentQuestion.factorB}`
    const currentStats = localStats.get(currentKey) || { correct: 0, incorrect: 0 }
    const currentLevel = getLevel(currentStats.correct, currentStats.incorrect)

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 w-full sm:w-auto">
                    <div className="flex justify-between items-center sm:block">
                        <h2 className="text-xl md:text-2xl font-bold text-purple-700">Pregunta {currentIndex + 1} de {questions.length}</h2>
                        <Button variant="ghost" size="icon" onClick={onCancel} className="sm:hidden -mr-2">
                            <X className="h-6 w-6 text-gray-400 hover:text-red-500" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className={cn("w-4 h-4", timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-gray-500")} />
                        <span className={cn("font-mono font-bold", timeLeft <= 5 ? "text-red-500" : "text-gray-600")}>
                            {timeLeft}s
                        </span>
                        <Progress value={(timeLeft / 20) * 100} className={cn("w-32 h-2", timeLeft <= 5 ? "bg-red-100 [&>div]:bg-red-500" : "")} />
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onCancel} className="hidden sm:inline-flex">
                    <X className="h-6 w-6 text-gray-400 hover:text-red-500" />
                </Button>
            </div>

            {/* Question Card */}
            <Card className={cn(
                "border-4 transition-all duration-500 transform relative overflow-hidden",
                feedback === "correct" ? "border-green-500 bg-green-50 scale-105" :
                    (feedback === "incorrect" || feedback === "timeout") ? "border-red-500 bg-red-50" :
                        "border-purple-200 bg-white"
            )}>
                {/* Level Up Overlay */}
                {levelUp && (
                    <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center animate-in fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-2xl text-center animate-in zoom-in slide-in-from-bottom-4">
                            <div className="text-4xl mb-2">
                                {levelUp.type === "mastered" ? "👑" : "⭐"}
                            </div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                                {levelUp.type === "mastered" ? "¡MAESTRÍA!" : "¡SUBIDA DE NIVEL!"}
                            </h3>
                            <p className="text-gray-600">
                                Has pasado a <span className={cn("font-bold px-2 py-0.5 rounded", getLevelColor(levelUp.to))}>{getLevelName(levelUp.to)}</span>
                            </p>
                        </div>
                    </div>
                )}

                <CardContent className="p-4 md:p-12 flex flex-col items-center justify-center space-y-6 md:space-y-8">

                    {/* The Operation */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 md:gap-4 text-5xl md:text-8xl font-bold text-slate-800">
                            <span>{currentQuestion.factorA}</span>
                            <span className="text-purple-500">×</span>
                            {variant === "guess_multiplier" ? (
                                <>
                                    <span className={cn(
                                        "min-w-[1.5ch] text-center border-b-4 border-dashed",
                                        feedback === "correct" ? "text-green-600 border-green-600" :
                                            (feedback === "incorrect" || feedback === "timeout") ? "text-red-600 border-red-600" :
                                                "text-purple-600 border-purple-300"
                                    )}>
                                        {feedback === "none" ? (userInput || "?") :
                                            feedback === "timeout" ? "!" : userInput}
                                    </span>
                                    <span className="text-gray-400">=</span>
                                    <span>{currentQuestion.answer}</span>
                                </>
                            ) : (
                                <>
                                    <span>{currentQuestion.factorB}</span>
                                    <span className="text-gray-400">=</span>
                                    <span className={cn(
                                        "min-w-[1.5ch] text-center border-b-4 border-dashed",
                                        feedback === "correct" ? "text-green-600 border-green-600" :
                                            (feedback === "incorrect" || feedback === "timeout") ? "text-red-600 border-red-600" :
                                                "text-purple-600 border-purple-300"
                                    )}>
                                        {feedback === "none" ? (userInput || "?") :
                                            feedback === "timeout" ? "!" : userInput}
                                    </span>
                                </>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => speakQuestion(currentQuestion)}
                        >
                            <Volume2 className="w-5 h-5 mr-2" />
                            Repetir pregunta
                        </Button>
                    </div>

                    {/* Feedback Message */}
                    {(feedback === "incorrect" || feedback === "timeout") && (
                        <div className="text-center animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-2xl text-red-600 font-bold mb-2">
                                {feedback === "timeout" ? "¡Se acabó el tiempo!" : "¡Casi!"}
                            </p>
                            <p className="text-lg text-gray-600">
                                La respuesta correcta es <span className="font-bold text-green-600 text-xl">
                                    {variant === "guess_multiplier" ? currentQuestion.factorB : currentQuestion.answer}
                                </span>
                            </p>
                            <Button
                                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => {
                                    if (currentIndex < questions.length - 1) {
                                        setCurrentIndex(prev => prev + 1)
                                        setQuestionStartTime(Date.now())
                                        setFeedback("none")
                                        setLevelUp(null)
                                        setUserInput("")
                                        inputRef.current?.focus()
                                    } else {
                                        const totalTime = Math.floor((Date.now() - startTime) / 1000)
                                        const score = results.filter(r => r.correct).length
                                        onComplete(results, score, totalTime)
                                    }
                                }}
                            >
                                Continuar
                            </Button>
                        </div>
                    )}

                    {/* Input Area */}
                    {feedback === "none" && (
                        <div className="w-full max-w-sm space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    ref={inputRef}
                                    type="number"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAnswer(userInput)}
                                    className="text-center text-3xl h-14 md:h-16 font-bold"
                                    placeholder="?"
                                    autoFocus
                                />
                                <Button
                                    size="icon"
                                    className={cn("h-14 w-14 md:h-16 md:w-16 shrink-0", isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-purple-600 hover:bg-purple-700")}
                                    onClick={toggleListening}
                                >
                                    {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                                </Button>
                            </div>

                            <Button
                                className="w-full h-12 text-lg"
                                onClick={() => handleAnswer(userInput)}
                                disabled={!userInput}
                            >
                                <Send className="mr-2 h-5 w-5" /> Responder
                            </Button>

                            <p className="text-center text-sm text-gray-400">
                                O presiona Enter para enviar
                            </p>
                        </div>
                    )}

                    {/* Current Level Indicator (Always visible) */}
                    {feedback !== "none" && (
                        <div className="animate-in fade-in mt-4">
                            <div className={cn("px-4 py-2 rounded-full border-2 font-bold text-sm flex items-center gap-2", getLevelColor(currentLevel))}>
                                <span>Nivel: {getLevelName(currentLevel)}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
