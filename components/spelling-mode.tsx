"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, ThumbsUp, Volume2, Lightbulb, AlignJustify, ArrowRight } from "lucide-react"

type SpellingModeProps = {
  word: { english: string; spanish: string; category?: string }
  onComplete: (correct: boolean, timeUsed: number, userAnswer: string) => void
}

export default function SpellingMode({ word, onComplete }: SpellingModeProps) {
  const [userInput, setUserInput] = useState("")
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds per word
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [startTime] = useState(Date.now())
  const [currentWord, setCurrentWord] = useState(word)
  const [userConfirmed, setUserConfirmed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSpelling, setIsSpelling] = useState(false)
  const [hintShown, setHintShown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const spellTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize when the word changes
  useEffect(() => {
    setCurrentWord(word)
    setTimeLeft(60)
    setUserInput("")
    setShowResult(false)
    setIsCorrect(false)
    setUserConfirmed(false)
    setHintShown(false)
    setIsSpelling(false)

    // Clear any existing spelling timeout
    if (spellTimeoutRef.current) {
      clearTimeout(spellTimeoutRef.current)
    }

    // Focus on the input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }, [word])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spellTimeoutRef.current) {
        clearTimeout(spellTimeoutRef.current)
      }
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      checkAnswer()
    }
  }, [timeLeft, showResult])

  // Check the answer
  const checkAnswer = () => {
    const normalizedUserInput = userInput.trim().toLowerCase().replace(/\s+/g, "")
    const normalizedCorrectAnswer = currentWord.english.toLowerCase().replace(/\s+/g, "")
    const correct = normalizedUserInput === normalizedCorrectAnswer
    setIsCorrect(correct)
    setShowResult(true)

    // Ya no establecemos un temporizador para respuestas correctas
    // El usuario debe hacer clic en "Siguiente" para continuar
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    checkAnswer()
  }

  // Handle user confirmation after incorrect answer
  const handleUserConfirmed = () => {
    setUserConfirmed(true)
    const timeUsed = 60 - timeLeft
    onComplete(isCorrect, timeUsed, userInput)
  }

  // Handle next word after correct answer
  const handleNextWord = () => {
    const timeUsed = 60 - timeLeft
    onComplete(isCorrect, timeUsed, userInput)
  }

  // Pronounce the word
  const pronounceWord = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      setIsPlaying(true)
      const utterance = new SpeechSynthesisUtterance(currentWord.english)
      utterance.lang = "en-US"
      utterance.rate = 0.8 // Slightly slower for learning

      utterance.onend = () => {
        setIsPlaying(false)
      }

      window.speechSynthesis.speak(utterance)
    }
  }

  // Spell the word letter by letter
  const spellWord = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      // Clear any existing timeout
      if (spellTimeoutRef.current) {
        clearTimeout(spellTimeoutRef.current)
      }

      setIsSpelling(true)

      const chars = currentWord.english.split("")

      // Function to speak each character with a delay
      const speakChars = (index = 0) => {
        if (index < chars.length) {
          const char = chars[index]
          const textToSpeak = char === " " ? "space" : char
          const utterance = new SpeechSynthesisUtterance(textToSpeak)
          utterance.lang = "en-US"
          utterance.rate = 0.8

          utterance.onend = () => {
            // Schedule the next character after a short pause
            spellTimeoutRef.current = setTimeout(() => {
              speakChars(index + 1)
            }, 800) // 800ms pause between characters
          }

          window.speechSynthesis.speak(utterance)
        } else {
          // All characters have been spoken
          setIsSpelling(false)
        }
      }

      // Start speaking the first character
      speakChars()
    }
  }

  // Show hint (first letter)
  const showHint = () => {
    if (!hintShown) {
      setHintShown(true)
    }
  }

  return (
    <Card className="bg-white/90 backdrop-blur shadow-lg">
      <CardContent className="p-4 md:p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-500 mr-1" />
            <span className={`text-sm md:text-base font-medium ${timeLeft < 10 ? "text-red-500" : "text-gray-700"}`}>
              {timeLeft} segundos
            </span>
          </div>
          <div className="text-xs md:text-sm text-gray-500">Spelling Bee Challenge</div>
        </div>

        <Progress value={((60 - timeLeft) / 60) * 100} className="h-2 mb-4 md:mb-6" />

        <div className="mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-center text-purple-700 mb-2">
            Escucha y escribe la palabra:
          </h3>
          <div className="flex justify-center gap-3 mb-4">
            <Button
              onClick={pronounceWord}
              className="bg-amber-500 hover:bg-amber-600 rounded-full h-14 w-14 flex items-center justify-center"
              disabled={isPlaying || isSpelling}
            >
              <Volume2 className={`h-7 w-7 ${isPlaying ? "animate-pulse" : ""}`} />
              <span className="sr-only">Escuchar pronunciación</span>
            </Button>

            <Button
              onClick={spellWord}
              className="bg-amber-400 hover:bg-amber-500 rounded-full h-14 w-14 flex items-center justify-center"
              disabled={isPlaying || isSpelling}
            >
              <AlignJustify className={`h-7 w-7 ${isSpelling ? "animate-pulse" : ""}`} />
              <span className="sr-only">Deletrear palabra</span>
            </Button>
          </div>

          <div className="text-center mb-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Escuchar palabra completa</span> o{" "}
              <span className="font-medium">Deletrear letra por letra</span>
            </p>
            <div className="flex justify-center gap-1 mt-3">
              {currentWord.english.split("").map((char, idx) => (
                <div
                  key={idx}
                  className={`${char === " " ? "w-2" : "w-3"} h-0.5 ${char === " " ? "bg-transparent" : "bg-gray-300"} rounded`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {currentWord.english.length} caracteres
              {currentWord.english.includes(" ") && " (incluye espacios)"}
            </p>
          </div>

          {hintShown && (
            <p className="text-center text-sm text-gray-600 mb-2">
              Pista: La palabra comienza con{" "}
              <span className="font-bold text-purple-700">{currentWord.english.charAt(0)}</span>
            </p>
          )}
        </div>

        {!showResult ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full max-w-md text-center text-xl md:text-2xl font-bold border-2 border-amber-300 rounded-md p-3 focus:border-amber-500 focus:outline-none"
                placeholder="Escribe la palabra aquí..."
                autoComplete="off"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={showHint}
                disabled={hintShown}
                className="flex-1 text-xs md:text-sm bg-transparent"
              >
                <Lightbulb className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Pista
              </Button>

              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-xs md:text-sm"
              >
                Comprobar
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className={`p-3 md:p-4 rounded-lg text-center ${isCorrect ? "bg-green-100" : "bg-red-100"}`}>
              <p className={`text-lg md:text-xl font-bold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                {isCorrect ? "¡Correcto!" : "¡Incorrecto!"}
              </p>

              <div className="mt-3 space-y-2">
                <div className="flex flex-col items-center">
                  <p className="text-sm text-gray-600">Tu respuesta:</p>
                  <p className={`text-base md:text-lg font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                    {userInput || "(no has escrito nada)"}
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="text-sm text-gray-600">Respuesta correcta:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-base md:text-lg font-bold text-green-600">{currentWord.english}</p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600"
                        onClick={pronounceWord}
                        disabled={isPlaying || isSpelling}
                      >
                        <Volume2 className={`h-5 w-5 ${isPlaying ? "animate-pulse" : ""}`} />
                        <span className="sr-only">Escuchar pronunciación</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600"
                        onClick={spellWord}
                        disabled={isPlaying || isSpelling}
                      >
                        <AlignJustify className={`h-5 w-5 ${isSpelling ? "animate-pulse" : ""}`} />
                        <span className="sr-only">Deletrear palabra</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!isCorrect && !userConfirmed && (
              <Button
                onClick={handleUserConfirmed}
                className="w-full py-6 text-lg font-bold bg-blue-500 hover:bg-blue-600"
              >
                <ThumbsUp className="h-5 w-5 mr-2" />
                LO HE COMPRENDIDO
              </Button>
            )}

            {isCorrect && (
              <Button
                onClick={handleNextWord}
                className="w-full py-6 text-lg font-bold bg-green-500 hover:bg-green-600"
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                SIGUIENTE
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
