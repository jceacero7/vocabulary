import { create } from "zustand"
import { loadUsers, saveUsers } from "@/lib/db-service"

export type User = {
  id: string
  name: string
  avatar?: string
  createdAt: string
}

interface UserState {
  users: User[]
  currentUser: User | null
  addUser: (name: string, avatar?: string) => Promise<User>
  setCurrentUser: (userId: string | null) => void
  updateUser: (userId: string, name: string, avatar?: string) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  loadUsers: () => Promise<void>
  isLoading: boolean
  error: string | null
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,

  // Cargar usuarios desde la base de datos
  loadUsers: async () => {
    try {
      set({ isLoading: true, error: null })
      const users = await loadUsers()
      set({
        users,
        isLoading: false,
      })
    } catch (error) {
      console.error("Error loading users:", error)
      set({
        error: "Error al cargar los usuarios",
        isLoading: false,
      })
    }
  },

  // Añadir un usuario a la base de datos
  addUser: async (name: string, avatar?: string) => {
    try {
      set({ isLoading: true, error: null })
      const newUser: User = {
        id: Date.now().toString(),
        name: name.trim(),
        avatar,
        createdAt: new Date().toISOString(),
      }

      // Añadir al estado local
      set((state) => ({
        users: [...state.users, newUser],
        currentUser: newUser,
        isLoading: false,
      }))

      // Guardar en la base de datos
      await saveUsers([...get().users])

      return newUser
    } catch (error) {
      console.error("Error adding user:", error)
      set({
        error: "Error al añadir el usuario",
        isLoading: false,
      })
      throw error
    }
  },

  // Establecer el usuario actual
  setCurrentUser: (userId: string | null) => {
    if (!userId) {
      set({ currentUser: null })
      return
    }

    const user = get().users.find((u) => u.id === userId) || null
    set({ currentUser: user })
  },

  // Actualizar un usuario en la base de datos
  updateUser: async (userId: string, name: string, avatar?: string) => {
    try {
      set({ isLoading: true, error: null })

      // Actualizar en el estado local
      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId
            ? {
                ...user,
                name: name.trim(),
                avatar: avatar || user.avatar,
              }
            : user,
        ),
        currentUser:
          state.currentUser?.id === userId
            ? { ...state.currentUser, name: name.trim(), avatar: avatar || state.currentUser.avatar }
            : state.currentUser,
        isLoading: false,
      }))

      // Guardar en la base de datos
      await saveUsers([...get().users])
    } catch (error) {
      console.error("Error updating user:", error)
      set({
        error: "Error al actualizar el usuario",
        isLoading: false,
      })
    }
  },

  // Eliminar un usuario de la base de datos
  deleteUser: async (userId: string) => {
    try {
      set({ isLoading: true, error: null })

      // Eliminar del estado local
      set((state) => ({
        users: state.users.filter((user) => user.id !== userId),
        currentUser: state.currentUser?.id === userId ? null : state.currentUser,
        isLoading: false,
      }))

      // Guardar en la base de datos
      await saveUsers([...get().users])
    } catch (error) {
      console.error("Error deleting user:", error)
      set({
        error: "Error al eliminar el usuario",
        isLoading: false,
      })
    }
  },
}))
