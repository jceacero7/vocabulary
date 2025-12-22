"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/auth-store"
import { getUsers, verifyUser, createUser } from "@/lib/db-users"
import { UserPlus, LogIn, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LoginScreen() {
    const [users, setUsers] = useState<any[]>([])
    const [selectedUser, setSelectedUser] = useState<string | null>(null)
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [newUserName, setNewUserName] = useState("")
    const [newUserPassword, setNewUserPassword] = useState("")

    const login = useAuthStore(state => state.login)

    useEffect(() => {
        console.log("LoginScreen: mounted, loading users...")
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            console.log("LoginScreen: calling getUsers")
            const loadedUsers = await getUsers()
            console.log("LoginScreen: users loaded", loadedUsers)
            setUsers(loadedUsers)
            if (loadedUsers.length > 0) {
                // Pre-select Daniela if she exists
                const daniela = loadedUsers.find(u => u.name === 'Daniela')
                if (daniela) setSelectedUser(daniela.id)
                else setSelectedUser(loadedUsers[0].id)
            }
        } catch (e) {
            console.error("Failed to load users", e)
            setError("Error al cargar usuarios")
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser || !password) return

        setIsLoading(true)
        setError("")

        try {
            const isValid = await verifyUser(selectedUser, password)
            if (isValid) {
                const user = users.find(u => u.id === selectedUser)
                login(user)
            } else {
                setError("Contraseña incorrecta")
            }
        } catch (e) {
            setError("Error al iniciar sesión")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newUserName || !newUserPassword) return

        setIsLoading(true)
        setError("")

        try {
            const newUser = await createUser(newUserName, newUserPassword)
            await loadUsers()
            setIsCreating(false)
            setSelectedUser(newUser.id)
            setPassword("")
            // Optional: Auto login? Let's make them enter password to confirm
        } catch (e) {
            setError("Error al crear usuario")
        } finally {
            setIsLoading(false)
        }
    }

    if (isCreating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-blue-100 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center text-purple-700">Nuevo Usuario</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={newUserName}
                                    onChange={e => setNewUserName(e.target.value)}
                                    placeholder="Nombre del niño/a"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">Contraseña (o PIN)</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newUserPassword}
                                    onChange={e => setNewUserPassword(e.target.value)}
                                    placeholder="Ej: 1234"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <div className="flex gap-2 pt-4">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreating(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                    Crear
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-blue-100 p-4">
            <Card className="w-full max-w-md shadow-xl border-purple-200">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl font-bold text-center text-purple-800">¡Hola!</CardTitle>
                    <p className="text-center text-gray-500">¿Quién va a practicar hoy?</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => setSelectedUser(user.id)}
                                    className={cn(
                                        "cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all hover:scale-105",
                                        selectedUser === user.id
                                            ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                                            : "border-gray-200 hover:border-purple-300 bg-white"
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-xl font-bold text-purple-600">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-gray-700">{user.name}</span>
                                </div>
                            ))}
                            <div
                                onClick={() => setIsCreating(true)}
                                className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-4 flex flex-col items-center justify-center gap-2 hover:border-purple-400 hover:bg-purple-50 transition-all"
                            >
                                <UserPlus className="w-8 h-8 text-gray-400" />
                                <span className="text-sm text-gray-500">Nuevo</span>
                            </div>
                        </div>

                        {selectedUser && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Contraseña de {users.find(u => u.id === selectedUser)?.name}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Introduce tu contraseña"
                                        className="text-center text-lg tracking-widest"
                                        autoFocus
                                    />
                                </div>

                                {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

                                <Button type="submit" className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="mr-2" />}
                                    Entrar
                                </Button>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
