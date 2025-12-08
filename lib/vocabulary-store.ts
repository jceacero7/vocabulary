import { create } from "zustand"
import { loadWords, saveWords, loadGameHistory, saveGameResult } from "@/lib/db-service"

type Word = {
  id: string
  english: string
  spanish: string
  category: string
}

export type WordResult = {
  spanish: string
  english: string
  userAnswer: string
  correct: boolean
  timeUsed: number
}

export type GameResult = {
  id: string
  userId: string
  date: string
  score: number
  totalWords: number
  timeUsed: number
  wordResults: WordResult[]
  categories: string[]
}

interface VocabularyState {
  words: Word[]
  categories: string[]
  gameHistory: GameResult[]
  addWord: (english: string, spanish: string, category: string) => Promise<void>
  updateWord: (id: string, english: string, spanish: string, category: string) => Promise<void>
  deleteWord: (id: string) => Promise<void>
  addCategory: (category: string) => Promise<void>
  deleteCategory: (category: string) => Promise<void>
  addGameResult: (result: Omit<GameResult, "id">) => Promise<void>
  getGameHistoryForUser: (userId: string) => Promise<GameResult[]>
  loadWords: () => Promise<void>
  clearGameHistory: (userId: string) => Promise<void>
  fetchCategories: () => Promise<void>
  syncWithDatabase: () => Promise<boolean>
  isLoading: boolean
  error: string | null
  importWordsFromCSV: (csvData: string) => Promise<boolean>
  clearAllWordsAndCategories: () => Promise<boolean>
}

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
  words: [],
  categories: [],
  gameHistory: [],
  isLoading: false,
  error: null,

  // Cargar palabras desde la base de datos
  loadWords: async () => {
    try {
      set({ isLoading: true, error: null })
      const data = await loadWords()
      set({
        words: data.words || [],
        categories: data.categories || [],
        isLoading: false,
      })
    } catch (error) {
      console.error("Error loading words:", error)
      set({
        error: "Error al cargar las palabras",
        isLoading: false,
      })
    }
  },

  // Cargar categorías desde la base de datos
  fetchCategories: async () => {
    try {
      set({ isLoading: true, error: null })
      const data = await loadWords()
      set({
        categories: data.categories || [],
        isLoading: false,
      })
    } catch (error) {
      console.error("Error loading categories:", error)
      set({
        error: "Error al cargar las categorías",
        isLoading: false,
      })
    }
  },

  // Añadir una palabra a la base de datos
  addWord: async (english: string, spanish: string, category: string) => {
    try {
      set({ isLoading: true, error: null })
      const newWord: Word = {
        id: Date.now().toString(),
        english: english.trim(),
        spanish: spanish.trim(),
        category: category.trim(),
      }

      // Añadir la palabra al estado local
      set((state) => ({
        words: [...state.words, newWord],
        isLoading: false,
      }))

      // Guardar en la base de datos
      await saveWords([...get().words], [...get().categories])

      // Añadir categoría si no existe
      if (category && !get().categories.includes(category)) {
        await get().addCategory(category)
      }
    } catch (error) {
      console.error("Error adding word:", error)
      set({
        error: "Error al añadir la palabra",
        isLoading: false,
      })
    }
  },

  // Actualizar una palabra en la base de datos
  updateWord: async (id: string, english: string, spanish: string, category: string) => {
    try {
      set({ isLoading: true, error: null })

      // Actualizar en el estado local
      set((state) => ({
        words: state.words.map((word) =>
          word.id === id
            ? { ...word, english: english.trim(), spanish: spanish.trim(), category: category.trim() }
            : word,
        ),
        isLoading: false,
      }))

      // Guardar en la base de datos
      await saveWords([...get().words], [...get().categories])

      // Añadir categoría si no existe
      if (category && !get().categories.includes(category)) {
        await get().addCategory(category)
      }
    } catch (error) {
      console.error("Error updating word:", error)
      set({
        error: "Error al actualizar la palabra",
        isLoading: false,
      })
    }
  },

  // Eliminar una palabra de la base de datos
  deleteWord: async (id: string) => {
    try {
      set({ isLoading: true, error: null })

      // Eliminar del estado local
      set((state) => ({
        words: state.words.filter((word) => word.id !== id),
        isLoading: false,
      }))

      // Guardar en la base de datos
      await saveWords([...get().words], [...get().categories])
    } catch (error) {
      console.error("Error deleting word:", error)
      set({
        error: "Error al eliminar la palabra",
        isLoading: false,
      })
    }
  },

  // Añadir una categoría a la base de datos
  addCategory: async (category: string) => {
    try {
      if (category && !get().categories.includes(category)) {
        set({ isLoading: true, error: null })

        // Añadir al estado local
        set((state) => ({
          categories: [...state.categories, category],
          isLoading: false,
        }))

        // Guardar en la base de datos
        await saveWords([...get().words], [...get().categories])
      }
    } catch (error) {
      console.error("Error adding category:", error)
      set({
        error: "Error al añadir la categoría",
        isLoading: false,
      })
    }
  },

  // Eliminar una categoría de la base de datos
  deleteCategory: async (category: string) => {
    try {
      set({ isLoading: true, error: null })

      // Eliminar del estado local
      set((state) => ({
        categories: state.categories.filter((cat) => cat !== category),
        words: state.words.map((word) => (word.category === category ? { ...word, category: "" } : word)),
        isLoading: false,
      }))

      // Guardar en la base de datos
      await saveWords([...get().words], [...get().categories])
    } catch (error) {
      console.error("Error deleting category:", error)
      set({
        error: "Error al eliminar la categoría",
        isLoading: false,
      })
    }
  },

  // Añadir un resultado de juego a la base de datos
  addGameResult: async (result) => {
    try {
      set({ isLoading: true, error: null })
      const newResult: GameResult = {
        id: Date.now().toString(),
        ...result,
      }

      // Añadir al estado local
      set((state) => ({
        gameHistory: [newResult, ...state.gameHistory],
        isLoading: false,
      }))

      // Guardar en la base de datos
      await saveGameResult(newResult)
    } catch (error) {
      console.error("Error adding game result:", error)
      set({
        error: "Error al guardar el resultado del juego",
        isLoading: false,
      })
    }
  },

  // Obtener el historial de juegos de un usuario desde la base de datos
  getGameHistoryForUser: async (userId: string) => {
    try {
      set({ isLoading: true, error: null })
      const history = await loadGameHistory(userId)
      set({
        gameHistory: history,
        isLoading: false,
      })
      return history
    } catch (error) {
      console.error("Error getting game history:", error)
      set({
        error: "Error al obtener el historial de juegos",
        isLoading: false,
      })
      return []
    }
  },

  // Limpiar el historial de juegos de un usuario en la base de datos
  clearGameHistory: async (userId: string) => {
    try {
      set({ isLoading: true, error: null })

      // Eliminar del estado local
      set((state) => ({
        gameHistory: state.gameHistory.filter((result) => result.userId !== userId),
        isLoading: false,
      }))

      // Aquí deberíamos implementar la eliminación en la base de datos
      // Por ahora, simplemente actualizamos el estado local
    } catch (error) {
      console.error("Error clearing game history:", error)
      set({
        error: "Error al limpiar el historial de juegos",
        isLoading: false,
      })
    }
  },

  // Sincronizar con la base de datos
  syncWithDatabase: async () => {
    try {
      set({ isLoading: true, error: null })

      // Cargar datos desde la base de datos
      const data = await loadWords()
      set({
        words: data.words || [],
        categories: data.categories || [],
        isLoading: false,
      })

      return true
    } catch (error) {
      console.error("Error syncing with database:", error)
      set({
        error: "Error al sincronizar con la base de datos",
        isLoading: false,
      })
      return false
    }
  },

  // Importar palabras desde CSV
  importWordsFromCSV: async (csvData: string) => {
    try {
      set({ isLoading: true, error: null })

      // Parsear el CSV
      const lines = csvData.split("\n")
      const headers = lines[0].split(",")

      // Verificar que el CSV tiene el formato correcto
      const englishIndex = headers.findIndex((h) => h.trim().toLowerCase() === "english")
      const spanishIndex = headers.findIndex((h) => h.trim().toLowerCase() === "spanish")
      const categoryIndex = headers.findIndex((h) => h.trim().toLowerCase() === "category")

      if (englishIndex === -1 || spanishIndex === -1) {
        throw new Error('El CSV debe contener columnas "english" y "spanish"')
      }

      // Extraer categorías únicas
      const newCategories = new Set<string>()
      const currentCategories = new Set(get().categories)

      // Procesar cada línea
      const newWords: Word[] = []

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue

        const values = lines[i].split(",")
        const english = values[englishIndex].trim()
        const spanish = values[spanishIndex].trim()
        const category = categoryIndex !== -1 ? values[categoryIndex].trim() : ""

        if (english && spanish) {
          // Añadir la palabra
          newWords.push({
            id: Date.now() + i.toString(), // ID único
            english,
            spanish,
            category,
          })

          // Registrar la categoría si existe
          if (category && !currentCategories.has(category)) {
            newCategories.add(category)
          }
        }
      }

      // Añadir nuevas categorías
      const updatedCategories = [...get().categories]
      newCategories.forEach((category) => {
        updatedCategories.push(category)
      })

      // Actualizar el estado
      set({
        words: [...get().words, ...newWords],
        categories: updatedCategories,
        isLoading: false,
      })

      // Guardar en la base de datos
      await saveWords([...get().words, ...newWords], updatedCategories)

      return true
    } catch (error) {
      console.error("Error importing words from CSV:", error)
      set({
        error: `Error al importar palabras: ${error instanceof Error ? error.message : "Error desconocido"}`,
        isLoading: false,
      })
      return false
    }
  },

  // Eliminar todas las palabras y categorías
  clearAllWordsAndCategories: async () => {
    try {
      set({ isLoading: true, error: null })

      // Actualizar el estado local
      set({
        words: [],
        categories: [],
        isLoading: false,
      })

      // Guardar en la base de datos
      await saveWords([], [])

      return true
    } catch (error) {
      console.error("Error clearing words and categories:", error)
      set({
        error: "Error al eliminar todas las palabras y categorías",
        isLoading: false,
      })
      return false
    }
  },
}))
