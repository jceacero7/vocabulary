"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import WordChallenge from "./word-challenge"
import GameHistory from "./game-history"
import GameMenu from "./game-menu"
import WordDatabase from "./word-database"
import ResultsSummary from "./results-summary"
import CategorySelector from "./category-selector"
import UserSelector from "./user-selector"
import AdminPanel from "./admin-panel"
import { Sparkles, Trophy, RotateCcw, Home, Settings, AlertTriangle, RefreshCw } from "lucide-react"
import confetti from "canvas-confetti"
import { useVocabularyStore } from "@/lib/vocabulary-store"
import { useUserStore } from "@/lib/user-store"
import { isDatabaseAvailable } from "@/lib/db-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type GameState =
  | "user-select"
  | "menu"
  | "start"
  | "category-select"
  | "playing"
  | "finished"
  | "history"
  | "database"
  | "results"
  | "admin"
type Word = { english: string; spanish: string; category: string }

export type WordResult = {
  spanish: string
  english: string
  userAnswer: string
  correct: boolean
  timeUsed: number
}

export default function VocabularyGame() {
  const [gameState, setGameState] = useState<GameState>("user-select")
  const [currentWords, setCurrentWords] = useState<Word[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [totalTimeUsed, setTotalTimeUsed] = useState(0)
  const [wordResults, setWordResults] = useState<WordResult[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [numberOfWords, setNumberOfWords] = useState(12)
  const [dbSyncStatus, setDbSyncStatus] = useState<"synced" | "unsynced" | "checking" | "error">("checking")
  const [isSyncing, setIsSyncing] = useState(false)

  const {
    words,
    categories,
    loadWords,
    addGameResult,
    getGameHistoryForUser,
    isLoading,
    error,
    syncWithDatabase: syncStore,
  } = useVocabularyStore()

  const { currentUser } = useUserStore()

  // Load words on component mount and check database sync
  useEffect(() => {
    // Cargar palabras desde la base de datos
    loadWords()

    // Verificar si la base de datos está disponible y sincronizada
    checkDatabaseSync()
  }, [loadWords])

  // Check database synchronization
  const checkDatabaseSync = async () => {
    setDbSyncStatus("checking")
    try {
      const available = await isDatabaseAvailable()
      if (!available) {
        setDbSyncStatus("unsynced")
        return
      }

      setDbSyncStatus("synced")
    } catch (error) {
      console.error("Error checking database sync:", error)
      setDbSyncStatus("error")
    }
  }

  // Synchronize with database
  const handleSyncWithDatabase = async () => {
    setIsSyncing(true)
    try {
      const success = await syncStore()
      if (success) {
        setDbSyncStatus("synced")
      } else {
        setDbSyncStatus("error")
      }
    } catch (error) {
      console.error("Error syncing with database:", error)
      setDbSyncStatus("error")
    } finally {
      setIsSyncing(false)
    }
  }

  // Check if user is selected
  useEffect(() => {
    if (currentUser) {
      setGameState("menu")
    } else {
      setGameState("user-select")
    }
  }, [currentUser])

  // Generate a random exam with the specified number of words from selected categories
  const generateExam = (selectedCats: string[], wordCount: number) => {
    // Filter words by selected categories
    let filteredWords = words
    if (selectedCats.length > 0) {
      filteredWords = words.filter((word) => selectedCats.includes(word.category))
    }

    if (filteredWords.length === 0) {
      return []
    }

    if (filteredWords.length < wordCount) {
      // If we don't have enough words, use all available words
      return [...filteredWords].sort(() => 0.5 - Math.random())
    }

    const shuffled = [...filteredWords].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, wordCount)
  }

  // Start category selection
  const startCategorySelection = () => {
    setGameState("category-select")
  }

  // Handle category selection
  const handleCategorySelection = (selectedCats: string[], wordCount: number) => {
    setSelectedCategories(selectedCats)
    setNumberOfWords(wordCount)
    const examWords = generateExam(selectedCats, wordCount)

    if (examWords.length === 0) {
      // No words available for the selected categories
      alert(
        "No hay palabras disponibles para las categorías seleccionadas. Por favor, selecciona otras categorías o añade palabras.",
      )
      return
    }

    setCurrentWords(examWords)
    setCurrentWordIndex(0)
    setScore(0)
    setGameState("playing")
    setStartTime(Date.now())
    setTotalTimeUsed(0)
    setWordResults([])
  }

  // Start a new game with all categories
  const startGame = () => {
    setSelectedCategories([])
    setGameState("category-select")
  }

  // Handle word completion
  const handleWordComplete = (correct: boolean, timeUsed: number, userAnswer: string) => {
    // Record the result for this word
    const wordResult: WordResult = {
      spanish: currentWords[currentWordIndex].spanish,
      english: currentWords[currentWordIndex].english,
      userAnswer: userAnswer,
      correct,
      timeUsed,
    }

    setWordResults([...wordResults, wordResult])

    if (correct) {
      setScore(score + 1)

      // Show mini confetti for correct answer
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      })
    }

    setTotalTimeUsed(totalTimeUsed + timeUsed)

    if (currentWordIndex < currentWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
    } else {
      finishGame()
    }
  }

  // Finish the game
  const finishGame = () => {
    // First show the results summary
    setGameState("results")

    // Big confetti for game completion
    if (score > currentWords.length / 2) {
      confetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.6 },
      })
    }
  }

  // Save game results to history
  const saveGameResults = async () => {
    if (!currentUser) return

    // Add to store
    await addGameResult({
      userId: currentUser.id,
      date: new Date().toLocaleString(),
      score,
      totalWords: currentWords.length,
      timeUsed: totalTimeUsed,
      wordResults,
      categories: selectedCategories,
    })

    // Move to finished state
    setGameState("finished")
  }

  // Reset game to menu
  const goToMenu = () => {
    setGameState("menu")
  }

  // View history
  const viewHistory = async () => {
    if (currentUser) {
      await getGameHistoryForUser(currentUser.id)
    }
    setGameState("history")
  }

  // Manage words database
  const manageWords = () => {
    setGameState("database")
  }

  // Open admin panel
  const openAdminPanel = () => {
    setGameState("admin")
  }

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-purple-700 mb-2">Vocabulary Challenge</h1>
        <p className="text-base md:text-lg text-purple-600">¡Aprende inglés de forma divertida!</p>
        {currentUser && (
          <div className="flex items-center justify-center mt-1 gap-2">
            <p className="text-sm text-gray-600">
              Usuario: <span className="font-medium text-purple-600">{currentUser.name}</span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-purple-600"
              onClick={openAdminPanel}
            >
              <Settings className="h-3 w-3" />
              <span className="sr-only">Administración</span>
            </Button>
          </div>
        )}
      </header>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <RefreshCw className="h-6 w-6 text-purple-600 animate-spin mr-2" />
          <span className="text-purple-600">Cargando datos...</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Database Sync Alert */}
      {dbSyncStatus === "unsynced" && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Sincronización de datos</AlertTitle>
          <AlertDescription className="text-amber-700">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Los datos locales podrían no estar sincronizados con la base de datos.</span>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={handleSyncWithDatabase}
                disabled={isSyncing}
              >
                {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {gameState === "user-select" && <UserSelector />}

      {gameState === "menu" && (
        <GameMenu onStartGame={startGame} onViewHistory={viewHistory} onManageWords={manageWords} />
      )}

      {gameState === "category-select" && (
        <CategorySelector categories={categories} onSelectCategories={handleCategorySelection} onCancel={goToMenu} />
      )}

      {gameState === "start" && (
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-4 md:p-6 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-purple-700 mb-4">¿Estás listo para jugar?</h2>
            <p className="mb-6 text-sm md:text-base text-gray-700">
              Podrás configurar cuántas palabras quieres en tu examen (de 1 a 20) y seleccionar las categorías. Tienes 1
              minuto para cada palabra y puedes pedir pistas.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={goToMenu} variant="outline" className="px-4 py-2 md:px-6 md:py-3 text-base md:text-lg">
                <Home className="mr-2 h-4 w-4" /> Menú
              </Button>
              <Button
                onClick={startCategorySelection}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 md:px-6 md:py-3 text-base md:text-lg"
                disabled={words.length === 0}
              >
                <Sparkles className="mr-2 h-4 w-4" /> ¡Empezar!
              </Button>
            </div>
            {words.length === 0 && (
              <p className="mt-4 text-red-500 text-sm">
                No hay palabras disponibles. Por favor, añade palabras en la sección "Palabras".
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {gameState === "playing" && currentWords.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-base md:text-lg font-medium text-purple-700">
              Palabra {currentWordIndex + 1} de {currentWords.length}
            </div>
            <div className="text-base md:text-lg font-medium text-purple-700">Puntuación: {score}</div>
          </div>

          <WordChallenge word={currentWords[currentWordIndex]} onComplete={handleWordComplete} />

          <div className="flex justify-between">
            <Button onClick={goToMenu} variant="outline" size="sm">
              <Home className="mr-2 h-4 w-4" /> Menú
            </Button>
            <Button onClick={startGame} variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
            </Button>
          </div>
        </div>
      )}

      {gameState === "results" && (
        <div className="space-y-4">
          <ResultsSummary
            wordResults={wordResults}
            totalWords={currentWords.length}
            score={score}
            onContinue={saveGameResults}
          />
        </div>
      )}

      {gameState === "finished" && (
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-4 md:p-6 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-purple-700 mb-2">¡Juego terminado!</h2>
            <div className="flex items-center justify-center mb-4">
              <Trophy className="h-8 md:h-12 w-8 md:w-12 text-yellow-500 mr-2" />
              <p className="text-2xl md:text-3xl font-bold">
                {score} / {currentWords.length}
              </p>
            </div>
            <p className="mb-6 text-sm md:text-base text-gray-700">
              {score === currentWords.length
                ? "¡Perfecto! ¡Eres un campeón!"
                : score > currentWords.length / 2
                  ? "¡Buen trabajo! Sigue practicando."
                  : "Sigue practicando para mejorar."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={goToMenu} variant="outline" className="px-4 py-2 text-sm md:text-base">
                <Home className="mr-2 h-4 w-4" /> Menú
              </Button>
              <Button
                onClick={startGame}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 text-sm md:text-base"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Jugar de nuevo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {gameState === "history" && currentUser && (
        <div className="space-y-4">
          <GameHistory history={getGameHistoryForUser(currentUser.id)} />
          <div className="flex justify-center">
            <Button onClick={goToMenu} className="px-6">
              <Home className="mr-2 h-4 w-4" /> Volver al menú
            </Button>
          </div>
        </div>
      )}

      {gameState === "database" && (
        <div className="space-y-4">
          <WordDatabase />
          <div className="flex justify-center">
            <Button onClick={goToMenu} className="px-6">
              <Home className="mr-2 h-4 w-4" /> Volver al menú
            </Button>
          </div>
        </div>
      )}

      {gameState === "admin" && (
        <div className="space-y-4">
          <AdminPanel />
          <div className="flex justify-center">
            <Button onClick={goToMenu} className="px-6">
              <Home className="mr-2 h-4 w-4" /> Volver al menú
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
