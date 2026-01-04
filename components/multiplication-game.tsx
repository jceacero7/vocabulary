"use client"

import { useState } from "react"
import MultiplicationMenu from "./multiplication/multiplication-menu"
import MultiplicationChallenge from "./multiplication/multiplication-challenge"
import MultiplicationResults from "./multiplication/multiplication-results"
import AnalyticsDashboard from "./dashboard/analytics-dashboard"
import { useMultiplicationStore } from "@/lib/multiplication-store"
import { useAuthStore } from "@/lib/auth-store"
import { getMostFailedQuestions } from "@/lib/db-analytics"
import type { MultiplicationProblemResult } from "@/types/multiplication"

type GameState = "menu" | "playing" | "results" | "dashboard"

export default function MultiplicationGame() {
    const [gameState, setGameState] = useState<GameState>("menu")
    const [config, setConfig] = useState<{ tables: number[]; mode: "random" | "sequential" }>({
        tables: [],
        mode: "random"
    })
    const [initialQuestions, setInitialQuestions] = useState<any[] | undefined>(undefined)
    const [gameResults, setGameResults] = useState<{
        results: MultiplicationProblemResult[]
        score: number
        totalTime: number
    } | null>(null)

    const { addGameResult } = useMultiplicationStore()
    const { user } = useAuthStore()

    const handleStartGame = (tables: number[], mode: "random" | "sequential") => {
        setConfig({ tables, mode })
        setInitialQuestions(undefined)
        setGameState("playing")
    }

    const handleDashboard = () => {
        setGameState("dashboard")
    }

    const handlePracticeWeaknesses = async () => {
        if (!user) return
        try {
            const weakQuestions = await getMostFailedQuestions(user.id)
            if (weakQuestions.length === 0) {
                alert("¡Aún no tienes suficientes fallos registrados para practicar!")
                return
            }

            const questions = weakQuestions.map(q => ({
                factorA: q.factor_a,
                factorB: q.factor_b,
                answer: q.factor_a * q.factor_b
            }))

            setInitialQuestions(questions)
            setConfig({ tables: [], mode: "random" }) // Mode doesn't matter much here
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
        setConfig({ tables: [], mode: "random" })
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
                    initialQuestions={initialQuestions}
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
