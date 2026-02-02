"use client"

import { useState } from "react"
import MultiplicationMenu from "./multiplication/multiplication-menu"
import MultiplicationChallenge from "./multiplication/multiplication-challenge"
import MultiplicationResults from "./multiplication/multiplication-results"
import AnalyticsDashboard from "./dashboard/analytics-dashboard"
import { useMultiplicationStore } from "@/lib/multiplication-store"
import { useAuthStore } from "@/lib/auth-store"
import { getMostFailedQuestions, getQuestionStats } from "@/lib/db-analytics"
import type { MultiplicationProblemResult } from "@/types/multiplication"

type GameState = "menu" | "playing" | "results" | "dashboard"

export default function MultiplicationGame() {
    const [gameState, setGameState] = useState<GameState>("menu")
    const [config, setConfig] = useState<{ tables: number[]; mode: "random" | "sequential"; variant: "standard" | "guess_multiplier" }>({
        tables: [],
        mode: "random",
        variant: "standard"
    })
    const [initialQuestions, setInitialQuestions] = useState<any[] | undefined>(undefined)
    const [gameResults, setGameResults] = useState<{
        results: MultiplicationProblemResult[]
        score: number
        totalTime: number
    } | null>(null)

    const { addGameResult } = useMultiplicationStore()
    const { user } = useAuthStore()
    const [stats, setStats] = useState<any[]>([])

    const handleStartGame = async (tables: number[], mode: "random" | "sequential", variant: "standard" | "guess_multiplier") => {
        setConfig({ tables, mode, variant })
        setInitialQuestions(undefined)

        if (mode === "random" && user) {
            try {
                const questionStats = await getQuestionStats(user.id)
                setStats(questionStats)

                // Generate all possible questions from selected tables
                const possibleQuestions: any[] = []
                tables.forEach(table => {
                    for (let i = 1; i <= 10; i++) {
                        possibleQuestions.push({ factorA: table, factorB: i, answer: table * i })
                    }
                })

                // Calculate weights
                const weightedQuestions = possibleQuestions.map(q => {
                    const stat = questionStats.find((s: any) => s.factor_a === q.factorA && s.factor_b === q.factorB)
                    const attempts = stat ? stat.attempts : 0
                    const failures = stat ? stat.incorrect_count : 0

                    // Weight formula (Improved):
                    // Base: 10
                    // New questions bonus: +20
                    // Failures: * 10 (High priority)
                    // Review: 100 / (attempts + 1)
                    let weight = 10 + (attempts === 0 ? 20 : 0) + (failures * 10) + (100 / (attempts + 1))

                    // Add randomness factor (0.8 - 1.2) to break ties and avoid deterministic order
                    weight = weight * (0.8 + Math.random() * 0.4)

                    return { ...q, weight }
                })

                // Select 10 questions based on weights
                const selectedQuestions: any[] = []
                const questionsToSelect = [...weightedQuestions]

                for (let i = 0; i < 10; i++) {
                    if (questionsToSelect.length === 0) break

                    const totalWeight = questionsToSelect.reduce((sum, q) => sum + q.weight, 0)
                    let random = Math.random() * totalWeight

                    const selectedIndex = questionsToSelect.findIndex(q => {
                        random -= q.weight
                        return random <= 0
                    })

                    if (selectedIndex !== -1) {
                        selectedQuestions.push(questionsToSelect[selectedIndex])
                        questionsToSelect.splice(selectedIndex, 1) // Remove to avoid duplicates
                    } else {
                        // Fallback if something goes wrong with weights (shouldn't happen)
                        selectedQuestions.push(questionsToSelect[0])
                        questionsToSelect.shift()
                    }
                }

                setInitialQuestions(selectedQuestions)
            } catch (e) {
                console.error("Error generating weighted questions", e)
                // Fallback to default random logic in Challenge component if this fails
                setInitialQuestions(undefined)
            }
        } else {
            setInitialQuestions(undefined)
        }

        setGameState("playing")
    }

    const handleDashboard = () => {
        setGameState("dashboard")
    }

    const handlePracticeWeaknesses = async () => {
        if (!user) return
        try {
            // Fetch up to 30 weak questions
            const weakQuestions = await getMostFailedQuestions(user.id, 30)

            if (weakQuestions.length === 0) {
                alert("¡Aún no tienes suficientes fallos registrados para practicar!")
                return
            }

            // Shuffle and pick 10
            const shuffled = [...weakQuestions].sort(() => Math.random() - 0.5)
            const selected = shuffled.slice(0, 10)

            const questions = selected.map(q => ({
                factorA: q.factor_a,
                factorB: q.factor_b,
                answer: q.factor_a * q.factor_b
            }))

            setInitialQuestions(questions)
            setConfig({ tables: [], mode: "random", variant: "standard" }) // Mode doesn't matter much here
            setGameState("playing")
        } catch (e) {
            console.error("Error fetching weak questions", e)
        }
    }

    const handleGameComplete = async (results: MultiplicationProblemResult[], score: number, timeUsed: number) => {
        setGameResults({ results, score, totalTime: timeUsed })
        setGameState("results")

        if (user) {
            console.log("Saving game result for user:", user.id)
            await addGameResult({
                userId: user.id,
                date: new Date().toISOString(),
                score,
                totalQuestions: results.length,
                timeUsed,
                mode: config.mode,
                tablesSelected: config.tables,
                problemResults: results
            })
        } else {
            console.log("No user logged in, skipping save")
        }
    }

    const handlePlayAgain = () => {
        setGameState("playing")
    }

    const handleMenu = () => {
        setGameState("menu")
        setConfig({ tables: [], mode: "random", variant: "standard" })
        setInitialQuestions(undefined)
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {gameState === "menu" && (
                <MultiplicationMenu
                    onStart={handleStartGame}
                    onBack={() => window.location.reload()}
                    onDashboard={handleDashboard}
                    onPracticeWeaknesses={handlePracticeWeaknesses}
                />
            )}

            {gameState === "dashboard" && (
                <AnalyticsDashboard onBack={handleMenu} />
            )}

            {gameState === "playing" && (
                <MultiplicationChallenge
                    tables={config.tables}
                    mode={config.mode}
                    variant={config.variant}
                    initialQuestions={initialQuestions}
                    initialStats={stats}
                    onComplete={handleGameComplete}
                    onCancel={handleMenu}
                />
            )}

            {gameState === "results" && gameResults && (
                <MultiplicationResults
                    results={gameResults.results}
                    score={gameResults.score}
                    totalTime={gameResults.totalTime}
                    onPlayAgain={handlePlayAgain}
                    onMenu={handleMenu}
                />
            )}
        </div>
    )
}
