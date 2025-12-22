"use client"

import { useState, useEffect } from "react"
import VocabularyGame from "@/components/vocabulary-game"
import MultiplicationGame from "@/components/multiplication-game"
import LoginScreen from "@/components/auth/login-screen"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Calculator, ArrowLeft, LogOut } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"

type Module = "select" | "vocabulary" | "multiplication"

export default function Home() {
  const [activeModule, setActiveModule] = useState<Module>("select")
  const [isClient, setIsClient] = useState(false)
  const { user, logout } = useAuthStore()

  useEffect(() => {
    console.log("Page: mounted")
    setIsClient(true)
  }, [])

  console.log("Page: rendering, isClient:", isClient, "user:", user)

  if (!isClient) return null

  if (!user) {
    console.log("Page: showing LoginScreen")
    return <LoginScreen />
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {activeModule === "select" && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex justify-end">
              <Button variant="ghost" onClick={logout} className="text-purple-700 hover:bg-purple-100">
                <LogOut className="mr-2 h-4 w-4" /> Salir ({user.name})
              </Button>
            </div>

            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Aprende Jugando
              </h1>
              <p className="text-xl text-gray-600">¡Hola {user.name}! ¿Qué quieres practicar hoy?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <Card
                className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-400 bg-white/80 backdrop-blur"
                onClick={() => setActiveModule("vocabulary")}
              >
                <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-12 h-12 text-purple-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-800">Vocabulario</h2>
                    <p className="text-gray-500">Aprende nuevas palabras en inglés</p>
                  </div>
                  <Button className="w-full bg-purple-600 group-hover:bg-purple-700">Entrar</Button>
                </CardContent>
              </Card>

              <Card
                className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-pink-400 bg-white/80 backdrop-blur"
                onClick={() => setActiveModule("multiplication")}
              >
                <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Calculator className="w-12 h-12 text-pink-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-800">Multiplicar</h2>
                    <p className="text-gray-500">Practica las tablas del 1 al 10</p>
                  </div>
                  <Button className="w-full bg-pink-600 group-hover:bg-pink-700">Entrar</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeModule === "vocabulary" && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setActiveModule("select")}
              className="mb-4 hover:bg-white/50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
            </Button>
            <VocabularyGame />
          </div>
        )}

        {activeModule === "multiplication" && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setActiveModule("select")}
              className="mb-4 hover:bg-white/50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
            </Button>
            <MultiplicationGame />
          </div>
        )}
      </div>
    </main>
  )
}
