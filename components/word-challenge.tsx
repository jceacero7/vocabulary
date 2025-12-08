"use client"

import type React from "react"

import { useState, useEffect, useRef, createRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, ThumbsUp, Lightbulb, Volume2, AlignJustify, ArrowRight } from "lucide-react"

type WordProps = {
  word: { english: string; spanish: string; category?: string }
  onComplete: (correct: boolean, timeUsed: number, userAnswer: string) => void
}

export default function WordChallenge({ word, onComplete }: WordProps) {
  const [letters, setLetters] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds per word
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [startTime] = useState(Date.now())
  const [currentWord, setCurrentWord] = useState(word)
  const [userConfirmed, setUserConfirmed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSpelling, setIsSpelling] = useState(false)

  // Create an array of refs for each letter input
  const inputRefs = useRef<React.RefObject<HTMLInputElement>[]>([])
  const spellTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Maximum number of hints based on word length
  const getMaxHints = () => {
    const length = currentWord.english.length
    if (length <= 3) return 1
    if (length <= 5) return 2
    if (length <= 8) return 3
    return 4 // For very long words
  }

  const maxHints = getMaxHints()

  // Initialize the letters array and refs when the word changes
  useEffect(() => {
    setCurrentWord(word)
    const wordChars = word.english.split("")
    setLetters(wordChars.map((char) => (char === " " ? " " : "")))
    setTimeLeft(60)
    setHintsUsed(0)
    setShowResult(false)
    setIsCorrect(false)
    setUserConfirmed(false)
    setActiveIndex(wordChars.findIndex((char) => char !== " "))
    setIsSpelling(false)

    // Clear any existing spelling timeout
    if (spellTimeoutRef.current) {
      clearTimeout(spellTimeoutRef.current)
    }

    // Create refs for each letter input
    inputRefs.current = Array(wordChars.length)
      .fill(null)
      .map((_, i) => inputRefs.current[i] || createRef<HTMLInputElement>())

    // Focus on the first non-space input
    setTimeout(() => {
      const firstInputIndex = wordChars.findIndex((char) => char !== " ")
      if (firstInputIndex !== -1 && inputRefs.current[firstInputIndex]?.current) {
        inputRefs.current[firstInputIndex].current?.focus()
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

  // Focus on the active input when activeIndex changes
  useEffect(() => {
    if (inputRefs.current[activeIndex]?.current) {
      inputRefs.current[activeIndex].current?.focus()
    }
  }, [activeIndex])

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

  const getUserAnswer = () => {
    return letters.join("")
  }

  // Check the answer
  const checkAnswer = () => {
    const userAnswer = getUserAnswer().toLowerCase().replace(/\s+/g, "")
    const correctAnswer = currentWord.english.toLowerCase().replace(/\s+/g, "")
    const correct = userAnswer === correctAnswer
    setIsCorrect(correct)
    setShowResult(true)

    // Ya no establecemos un temporizador para respuestas correctas
    // El usuario debe hacer clic en "Siguiente" para continuar
  }

  // Handle letter input change
  const handleLetterChange = (index: number, value: string) => {
    if (currentWord.english[index] === " ") return

    // Only accept letters (no numbers or special characters)
    if (!/^[a-zA-Z]*$/.test(value)) return

    // Convert to uppercase
    value = value.toUpperCase()

    // Update the letters array
    const newLetters = [...letters]

    // If the user is typing a single character, just update that position
    if (value.length === 1) {
      newLetters[index] = value
      setLetters(newLetters)

      let nextIndex = index + 1
      while (nextIndex < currentWord.english.length && currentWord.english[nextIndex] === " ") {
        nextIndex++
      }
      if (nextIndex < currentWord.english.length) {
        setActiveIndex(nextIndex)
      }
    }
    // If the user pastes multiple characters, distribute them
    else if (value.length > 1) {
      const chars = value.split("")
      let charIndex = 0
      for (let i = index; i < newLetters.length && charIndex < chars.length; i++) {
        if (currentWord.english[i] !== " ") {
          newLetters[i] = chars[charIndex]
          charIndex++
        }
      }
      setLetters(newLetters)

      const nextEmptyIndex = newLetters.findIndex(
        (letter, idx) => idx > index && letter === "" && currentWord.english[idx] !== " ",
      )
      if (nextEmptyIndex !== -1) {
        setActiveIndex(nextEmptyIndex)
      } else {
        // Find last non-space position
        let lastIndex = newLetters.length - 1
        while (lastIndex >= 0 && currentWord.english[lastIndex] === " ") {
          lastIndex--
        }
        setActiveIndex(lastIndex)
      }
    }
  }

  // Handle key press in letter input
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (currentWord.english[index] === " ") return

    // If backspace is pressed and the current input is empty, move to the previous input
    if (e.key === "Backspace") {
      if (letters[index] === "" && index > 0) {
        let prevIndex = index - 1
        while (prevIndex >= 0 && currentWord.english[prevIndex] === " ") {
          prevIndex--
        }
        if (prevIndex >= 0) {
          setActiveIndex(prevIndex)
        }
        e.preventDefault()
      } else if (letters[index] !== "") {
        // If current input has a letter, clear it
        const newLetters = [...letters]
        newLetters[index] = ""
        setLetters(newLetters)
      }
    }
    // If right arrow is pressed, move to the next input
    else if (e.key === "ArrowRight") {
      let nextIndex = index + 1
      while (nextIndex < currentWord.english.length && currentWord.english[nextIndex] === " ") {
        nextIndex++
      }
      if (nextIndex < currentWord.english.length) {
        setActiveIndex(nextIndex)
      }
      e.preventDefault()
    }
    // If left arrow is pressed, move to the previous input
    else if (e.key === "ArrowLeft") {
      let prevIndex = index - 1
      while (prevIndex >= 0 && currentWord.english[prevIndex] === " ") {
        prevIndex--
      }
      if (prevIndex >= 0) {
        setActiveIndex(prevIndex)
      }
      e.preventDefault()
    }
    // If Enter is pressed, check the answer
    else if (e.key === "Enter") {
      checkAnswer()
      e.preventDefault()
    }
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
    onComplete(isCorrect, timeUsed, getUserAnswer())
  }

  // Handle next word after correct answer
  const handleNextWord = () => {
    const timeUsed = 60 - timeLeft
    onComplete(isCorrect, timeUsed, getUserAnswer())
  }

  // Get a hint
  const getHint = () => {
    if (hintsUsed < maxHints) {
      const newHintsUsed = hintsUsed + 1
      setHintsUsed(newHintsUsed)

      let nextEmptyIndex = letters.findIndex((letter, idx) => letter === "" && currentWord.english[idx] !== " ")
      if (nextEmptyIndex === -1) nextEmptyIndex = 0

      // Generate progressive hints based on how many have been used
      const newLetters = [...letters]

      // First hint: Fill the first letter
      if (newHintsUsed === 1) {
        newLetters[0] = currentWord.english[0].toUpperCase()
        nextEmptyIndex = newLetters.findIndex((letter, idx) => letter === "" && currentWord.english[idx] !== " ")
      }
      // Second hint: Fill the second non-space letter
      else if (newHintsUsed === 2 && currentWord.english.length > 1) {
        let secondCharIndex = 1
        while (secondCharIndex < currentWord.english.length && currentWord.english[secondCharIndex] === " ") {
          secondCharIndex++
        }
        if (secondCharIndex < currentWord.english.length) {
          newLetters[secondCharIndex] = currentWord.english[secondCharIndex].toUpperCase()
        }
        nextEmptyIndex = newLetters.findIndex((letter, idx) => letter === "" && currentWord.english[idx] !== " ")
      }
      // Third hint: Fill the last letter
      else if (newHintsUsed === 3 && currentWord.english.length > 2) {
        let lastIndex = currentWord.english.length - 1
        while (lastIndex >= 0 && currentWord.english[lastIndex] === " ") {
          lastIndex--
        }
        if (lastIndex >= 0) {
          newLetters[lastIndex] = currentWord.english[lastIndex].toUpperCase()
        }
        nextEmptyIndex = newLetters.findIndex((letter, idx) => letter === "" && currentWord.english[idx] !== " ")
      }
      // Fourth hint: Fill half of the remaining letters
      else if (newHintsUsed === 4) {
        const emptyIndices = newLetters
          .map((letter, idx) => (letter === "" && currentWord.english[idx] !== " " ? idx : -1))
          .filter((idx) => idx !== -1)
        const halfCount = Math.ceil(emptyIndices.length / 2)

        for (let i = 0; i < halfCount && i < emptyIndices.length; i++) {
          const idx = emptyIndices[i]
          newLetters[idx] = currentWord.english[idx].toUpperCase()
        }

        nextEmptyIndex = newLetters.findIndex((letter, idx) => letter === "" && currentWord.english[idx] !== " ")
      }

      setLetters(newLetters)

      // Set focus to the next empty position if available
      if (nextEmptyIndex !== -1) {
        setActiveIndex(nextEmptyIndex)
      }
    }
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

      const letters = currentWord.english.split("")

      // Function to speak each letter with a delay
      const speakLetters = (index = 0) => {
        if (index < letters.length) {
          const letter = letters[index]
          const utterance = new SpeechSynthesisUtterance(letter)
          utterance.lang = "en-US"
          utterance.rate = 0.8

          utterance.onend = () => {
            // Schedule the next letter after a short pause
            spellTimeoutRef.current = setTimeout(() => {
              speakLetters(index + 1)
            }, 800) // 800ms pause between letters
          }

          window.speechSynthesis.speak(utterance)
        } else {
          // All letters have been spoken
          setIsSpelling(false)
        }
      }

      // Start speaking the first letter
      speakLetters()
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
          <div className="text-xs md:text-sm text-gray-500">
            Pistas usadas: {hintsUsed}/{maxHints}
          </div>
        </div>

        <Progress value={((60 - timeLeft) / 60) * 100} className="h-2 mb-4 md:mb-6" />

        <div className="mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-center text-purple-700 mb-2">Traduce al inglés:</h3>
          <p className="text-xl md:text-2xl text-center font-bold text-gray-800">{currentWord.spanish}</p>
          {currentWord.category && (
            <p className="text-xs md:text-sm text-center text-gray-500 mt-1">
              Categoría: <span className="font-medium text-purple-600">{currentWord.category}</span>
            </p>
          )}
        </div>

        {!showResult ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center flex-wrap gap-2">
              {letters.map((letter, index) => {
                if (currentWord.english[index] === " ") {
                  return (
                    <div key={index} className="w-4 h-12 md:w-4 md:h-14 flex items-end justify-center pb-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                  )
                }

                return (
                  <input
                    key={index}
                    ref={inputRefs.current[index]}
                    type="text"
                    value={letter}
                    onChange={(e) => handleLetterChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onClick={() => setActiveIndex(index)}
                    maxLength={1}
                    className={`w-10 h-12 md:w-12 md:h-14 text-center text-xl md:text-2xl font-bold border-2 rounded-md 
                    ${index === activeIndex ? "border-purple-500 bg-purple-50" : "border-gray-300"}`}
                    autoComplete="off"
                  />
                )
              })}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={getHint}
                disabled={hintsUsed >= maxHints}
                className="flex-1 text-xs md:text-sm"
              >
                <Lightbulb className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Pista
              </Button>

              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-xs md:text-sm"
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
                    {getUserAnswer() || "(no has escrito nada)"}
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="text-sm text-gray-600">Respuesta correcta:</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600 mb-2">{currentWord.english}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                      onClick={pronounceWord}
                      disabled={isPlaying || isSpelling}
                    >
                      <Volume2 className={`h-4 w-4 mr-1 ${isPlaying ? "animate-pulse" : ""}`} />
                      Escuchar palabra
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent"
                      onClick={spellWord}
                      disabled={isPlaying || isSpelling}
                    >
                      <AlignJustify className={`h-4 w-4 mr-1 ${isSpelling ? "animate-pulse" : ""}`} />
                      Escuchar deletreo
                    </Button>
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
