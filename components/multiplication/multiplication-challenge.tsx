"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Send, X, Volume2, HelpCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import type { MultiplicationProblemResult } from "@/types/multiplication"

// Tipos para Web Speech API
interface IWindow extends Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
}

interface MultiplicationChallengeProps {
    tables: number[]
    mode: "random" | "sequential"
    initialQuestions?: Question[]
    onComplete: (results: MultiplicationProblemResult[], score: number, timeUsed: number) => void
    onCancel: () => void
}

type Question = {
    factorA: number
    factorB: number
    answer: number
}

export default function MultiplicationChallenge({ tables, mode, initialQuestions, onComplete, onCancel }: MultiplicationChallengeProps) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userInput, setUserInput] = useState("")
    const [isListening, setIsListening] = useState(false)
    const [feedback, setFeedback] = useState<"none" | "correct" | "incorrect" | "timeout">("none")
    const [results, setResults] = useState<MultiplicationProblemResult[]>([])
    const [startTime, setStartTime] = useState(Date.now())
    const [questionStartTime, setQuestionStartTime] = useState(Date.now())
    const [timeLeft, setTimeLeft] = useState(20)

    const inputRef = useRef<HTMLInputElement>(null)
    const recognitionRef = useRef<any>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Inicializar preguntas
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

    // Timer logic
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

    // Focus input on mount and question change
    useEffect(() => {
        if (feedback === "none" && inputRef.current) {
            inputRef.current.focus()
        }
    }, [currentIndex, feedback])

    // Configurar reconocimiento de voz
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

    const playAudio = (type: "correct" | "incorrect") => {
        const audio = new Audio(`/sounds/${type}.mp3`)
        audio.volume = 0.5
        audio.play().catch(e => console.error("Error playing sound:", e))
    }

    const speakQuestion = (question: Question) => {
        if (typeof window !== "undefined" && 'speechSynthesis' in window) {
            // Cancelar cualquier habla anterior
            window.speechSynthesis.cancel()

            const text = `${question.factorA} por ${question.factorB}`
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = 'es-ES'
            utterance.rate = 0.9 // Un poco más lento para que sea claro
            utterance.pitch = 1.1 // Un poco más agudo, tono amable

            window.speechSynthesis.speak(utterance)
        }
    }

    // Speak question when it changes
    useEffect(() => {
        if (questions.length > 0 && feedback === "none") {
            // Pequeño delay para que no se solape con el sonido de éxito anterior
            const timer = setTimeout(() => {
                speakQuestion(questions[currentIndex])
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [currentIndex, questions, feedback])

    const handleTimeout = () => {
        const currentQuestion = questions[currentIndex]
        const timeUsed = 20

        const newResult: MultiplicationProblemResult = {
            id: crypto.randomUUID(),
            gameId: "",
            factorA: currentQuestion.factorA,
            factorB: currentQuestion.factorB,
            userAnswer: -1, // Indicates timeout
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
        const isCorrect = numInput === currentQuestion.answer
        const timeUsed = Math.floor((Date.now() - questionStartTime) / 1000)

        const newResult: MultiplicationProblemResult = {
            id: crypto.randomUUID(),
            gameId: "",
            factorA: currentQuestion.factorA,
            factorB: currentQuestion.factorB,
            userAnswer: numInput,
            correct: isCorrect,
            timeUsed
        }

        const newResults = [...results, newResult]
        setResults(newResults)

        if (isCorrect) {
            setFeedback("correct")
            playAudio("correct")
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#a855f7', '#ec4899', '#ffffff']
            })
            setTimeout(() => {
                if (currentIndex < questions.length - 1) {
                    setCurrentIndex(prev => prev + 1)
                    setQuestionStartTime(Date.now())
                    setFeedback("none")
                    setUserInput("")
                } else {
                    const totalTime = Math.floor((Date.now() - startTime) / 1000)
                    const score = newResults.filter(r => r.correct).length
                    onComplete(newResults, score, totalTime)
                }
            }, 1000)
        } else {
            setFeedback("incorrect")
            playAudio("incorrect")
        }
    }

    if (questions.length === 0) return <div>Cargando...</div>

    const currentQuestion = questions[currentIndex]

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-purple-700">Pregunta {currentIndex + 1} de {questions.length}</h2>
                    <div className="flex items-center gap-2">
                        <Clock className={cn("w-4 h-4", timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-gray-500")} />
                        <span className={cn("font-mono font-bold", timeLeft <= 5 ? "text-red-500" : "text-gray-600")}>
                            {timeLeft}s
                        </span>
                        <Progress value={(timeLeft / 20) * 100} className={cn("w-32 h-2", timeLeft <= 5 ? "bg-red-100 [&>div]:bg-red-500" : "")} />
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onCancel}>
                    <X className="h-6 w-6 text-gray-400 hover:text-red-500" />
                </Button>
            </div>

            {/* Question Card */}
            <Card className={cn(
                "border-2 transition-all duration-300 transform",
                feedback === "correct" ? "border-green-500 bg-green-50 scale-105" :
                    (feedback === "incorrect" || feedback === "timeout") ? "border-red-500 bg-red-50" :
                        "border-purple-200 bg-white"
            )}>
                <CardContent className="p-8 md:p-12 flex flex-col items-center justify-center space-y-8">

                    {/* The Operation */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-4 text-6xl md:text-8xl font-bold text-slate-800">
                            <span>{currentQuestion.factorA}</span>
                            <span className="text-purple-500">×</span>
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
                                La respuesta correcta es <span className="font-bold text-green-600 text-xl">{currentQuestion.answer}</span>
                            </p>
                            <Button
                                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => {
                                    if (currentIndex < questions.length - 1) {
                                        setCurrentIndex(prev => prev + 1)
                                        setQuestionStartTime(Date.now())
                                        setFeedback("none")
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
                                    className="text-center text-3xl h-16 font-bold"
                                    placeholder="?"
                                    autoFocus
                                />
                                <Button
                                    size="icon"
                                    className={cn("h-16 w-16 shrink-0", isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-purple-600 hover:bg-purple-700")}
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
                </CardContent>
            </Card>
        </div>
    )
}
