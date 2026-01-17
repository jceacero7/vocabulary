import { create } from "zustand"
import { saveMultiplicationGameResult, loadMultiplicationHistory } from "@/lib/db-multiplication"
import type { MultiplicationGameResult } from "@/types/multiplication"
import { v4 as uuidv4 } from 'uuid';

interface MultiplicationState {
    history: MultiplicationGameResult[]
    isLoading: boolean
    error: string | null

    // Actions
    addGameResult: (result: Omit<MultiplicationGameResult, "id">) => Promise<void>
    loadHistory: (userId: string) => Promise<void>
    clearHistory: () => void
}

export const useMultiplicationStore = create<MultiplicationState>((set, get) => ({
    history: [],
    isLoading: false,
    error: null,

    addGameResult: async (result) => {
        try {
            set({ isLoading: true, error: null })

            const newResult: MultiplicationGameResult = {
                id: uuidv4(),
                ...result
            }

            // Optimistic update
            set(state => ({
                history: [newResult, ...state.history],
                isLoading: false
            }))

            // Persist to DB
            const success = await saveMultiplicationGameResult(newResult)

            if (!success) {
                set({ error: "Error al guardar el resultado en la base de datos" })
                // Rollback optimistic update if needed, but for now we keep local state
            }
        } catch (error) {
            console.error("Error adding multiplication game result:", error)
            set({
                error: "Error inesperado al guardar el resultado",
                isLoading: false
            })
        }
    },

    loadHistory: async (userId: string) => {
        try {
            set({ isLoading: true, error: null })
            const history = await loadMultiplicationHistory(userId)
            set({ history, isLoading: false })
        } catch (error) {
            console.error("Error loading multiplication history:", error)
            set({
                error: "Error al cargar el historial",
                isLoading: false
            })
        }
    },

    clearHistory: () => {
        set({ history: [] })
    }
}))
