export type MultiplicationGameResult = {
    id: string
    userId: string
    date: string
    score: number
    totalQuestions: number
    timeUsed: number
    mode: "random" | "sequential"
    tablesSelected: number[]
    problemResults: MultiplicationProblemResult[]
}

export type MultiplicationProblemResult = {
    id: string
    gameId: string
    factorA: number
    factorB: number
    userAnswer: number
    correct: boolean
    timeUsed: number
    levelBefore?: string
    levelAfter?: string
}
