"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { UserPlus, Edit, Trash, LogOut, User } from "lucide-react"
import { useUserStore, type User as UserType } from "@/lib/user-store"

export default function UserSelector() {
  const { users, currentUser, addUser, setCurrentUser, updateUser, deleteUser } = useUserStore()
  const [newUserName, setNewUserName] = useState("")
  const [editingUser, setEditingUser] = useState<UserType | null>(null)

  // Get initials from name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Handle adding a new user
  const handleAddUser = () => {
    if (newUserName.trim() === "") return
    addUser(newUserName)
    setNewUserName("")
  }

  // Handle updating a user
  const handleUpdateUser = () => {
    if (!editingUser || editingUser.name.trim() === "") return
    updateUser(editingUser.id, editingUser.name, editingUser.avatar)
    setEditingUser(null)
  }

  // Handle selecting a user
  const handleSelectUser = (userId: string) => {
    setCurrentUser(userId)
  }

  // Handle logging out
  const handleLogout = () => {
    setCurrentUser(null)
  }

  return (
    <Card className="bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl text-center text-purple-700">Selecciona un usuario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {users.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all ${
                  currentUser?.id === user.id
                    ? "bg-purple-100 border-2 border-purple-300"
                    : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                }`}
                onClick={() => handleSelectUser(user.id)}
              >
                <Avatar className="h-16 w-16 mb-2">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-purple-200 text-purple-700">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <p className="font-medium text-center text-sm">{user.name}</p>
                <div className="mt-2 flex gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingUser(user)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar usuario</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Nombre</Label>
                          <Input
                            id="edit-name"
                            value={editingUser?.name || ""}
                            onChange={(e) =>
                              setEditingUser(editingUser ? { ...editingUser, name: e.target.value } : null)
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline" onClick={() => setEditingUser(null)}>
                            Cancelar
                          </Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button onClick={handleUpdateUser}>Guardar</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                        <AlertDialogDescription>
                          ¿Estás seguro de que quieres eliminar a {user.name}? Esta acción eliminará también todo su
                          historial de juego.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteUser(user.id)} className="bg-red-500 hover:bg-red-600">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}

            <Dialog>
              <DialogTrigger asChild>
                <div className="flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 h-full min-h-[120px]">
                  <UserPlus className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Añadir usuario</p>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir nuevo usuario</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Nombre</Label>
                    <Input
                      id="new-name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Escribe el nombre del usuario"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleAddUser} disabled={newUserName.trim() === ""}>
                      Añadir
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No hay usuarios disponibles</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear primer usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir nuevo usuario</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Nombre</Label>
                    <Input
                      id="new-name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Escribe el nombre del usuario"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleAddUser} disabled={newUserName.trim() === ""}>
                      Añadir
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
      {currentUser && (
        <CardFooter className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
