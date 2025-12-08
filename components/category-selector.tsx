"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, BookOpen } from "lucide-react"

type CategorySelectorProps = {
  categories: string[]
  onSelectCategories: (categories: string[], numberOfWords: number) => void
  onCancel: () => void
}

export default function CategorySelector({ categories, onSelectCategories, onCancel }: CategorySelectorProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [numberOfWords, setNumberOfWords] = useState(12)

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCategories([])
    } else {
      setSelectedCategories([...categories])
    }
    setSelectAll(!selectAll)
  }

  // Handle individual category toggle
  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
      setSelectAll(false)
    } else {
      setSelectedCategories([...selectedCategories, category])
      if (selectedCategories.length + 1 === categories.length) {
        setSelectAll(true)
      }
    }
  }

  // Start game with selected categories and number of words
  const handleStartGame = () => {
    onSelectCategories(selectedCategories, numberOfWords)
  }

  return (
    <Card className="bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl text-center text-purple-700 flex items-center justify-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Configurar examen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selector de número de palabras */}
        <div className="space-y-3">
          <Label htmlFor="word-count" className="text-sm font-medium text-gray-700">
            Número de palabras para la prueba
          </Label>
          <Select value={numberOfWords.toString()} onValueChange={(value) => setNumberOfWords(Number.parseInt(value))}>
            <SelectTrigger id="word-count">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "palabra" : "palabras"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">Selecciona entre 1 y 20 palabras para tu examen (por defecto: 12)</p>
        </div>

        {/* Selector de categorías */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">Selecciona las categorías</Label>

          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
            <Label htmlFor="select-all" className="font-medium">
              Seleccionar todas las categorías
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                <Checkbox
                  id={`category-${index}`}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <Label htmlFor={`category-${index}`} className="text-sm">
                  {category}
                </Label>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No hay categorías disponibles. Por favor, añade categorías en la sección "Palabras".
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          <Home className="h-4 w-4 mr-2" /> Volver al menú
        </Button>
        <Button
          onClick={handleStartGame}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          disabled={selectedCategories.length === 0}
        >
          Empezar examen ({numberOfWords} {numberOfWords === 1 ? "palabra" : "palabras"})
        </Button>
      </CardFooter>
    </Card>
  )
}
