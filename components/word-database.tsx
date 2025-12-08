"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash, Save, X, RefreshCw, Tag, Download, Upload, AlertTriangle } from "lucide-react"
import { useVocabularyStore } from "@/lib/vocabulary-store"
import { translateWord } from "@/lib/translation-service"
// Añadir esta importación al inicio del archivo
import CSVImportHelper from "./csv-import-helper"

export default function WordDatabase() {
  const {
    words,
    categories,
    addWord,
    updateWord,
    deleteWord,
    addCategory,
    deleteCategory,
    loadWords,
    importWordsFromCSV,
    clearAllWordsAndCategories,
    isLoading,
    error,
  } = useVocabularyStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [newWord, setNewWord] = useState({ english: "", spanish: "", category: "" })
  const [editingWord, setEditingWord] = useState<{
    id: string
    english: string
    spanish: string
    category: string
  } | null>(null)
  const [newCategory, setNewCategory] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  // Cargar palabras al montar el componente
  useEffect(() => {
    loadWords()
  }, [loadWords])

  // Filter words based on search term and category
  const filteredWords = words.filter((word) => {
    const matchesSearch =
      word.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.spanish.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || word.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Paginate words
  const paginatedWords = filteredWords.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const totalPages = Math.ceil(filteredWords.length / itemsPerPage)

  // Handle adding a new word
  const handleAddWord = async () => {
    if (newWord.english.trim() === "") return

    // If Spanish translation is empty, try to translate
    if (newWord.spanish.trim() === "") {
      setIsTranslating(true)
      try {
        const translation = await translateWord(newWord.english)
        newWord.spanish = translation
      } catch (error) {
        console.error("Translation error:", error)
      } finally {
        setIsTranslating(false)
      }
    }

    await addWord(newWord.english, newWord.spanish, newWord.category)
    setNewWord({ english: "", spanish: "", category: "" })
  }

  // Handle updating a word
  const handleUpdateWord = async () => {
    if (!editingWord || editingWord.english.trim() === "") return
    await updateWord(editingWord.id, editingWord.english, editingWord.spanish, editingWord.category)
    setEditingWord(null)
  }

  // Handle adding a new category
  const handleAddCategory = async () => {
    if (newCategory.trim() === "") return
    await addCategory(newCategory.trim())
    setNewCategory("")
  }

  // Handle translating a word
  const handleTranslate = async () => {
    if (newWord.english.trim() === "") return

    setIsTranslating(true)
    try {
      const translation = await translateWord(newWord.english)
      setNewWord({ ...newWord, spanish: translation })
    } catch (error) {
      console.error("Translation error:", error)
    } finally {
      setIsTranslating(false)
    }
  }

  // Handle translating an editing word
  const handleTranslateEditing = async () => {
    if (!editingWord || editingWord.english.trim() === "") return

    setIsTranslating(true)
    try {
      const translation = await translateWord(editingWord.english)
      setEditingWord({ ...editingWord, spanish: translation })
    } catch (error) {
      console.error("Translation error:", error)
    } finally {
      setIsTranslating(false)
    }
  }

  // Referencia al input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manejar la importación de CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const csvData = event.target?.result as string
      if (csvData) {
        const success = await importWordsFromCSV(csvData)
        if (success) {
          alert("Palabras importadas correctamente")
        }
      }
    }
    reader.readAsText(file)

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Manejar la eliminación de todas las palabras y categorías
  const handleClearAll = async () => {
    const success = await clearAllWordsAndCategories()
    if (success) {
      alert("Todas las palabras y categorías han sido eliminadas")
    }
  }

  // Generar CSV con todas las palabras
  const generateCSV = () => {
    // Crear el contenido del CSV
    const headers = "id,english,spanish,category\n"
    const rows = words.map((word) => `${word.id},${word.english},${word.spanish},${word.category}`).join("\n")

    const csvContent = headers + rows

    // Crear un blob y un enlace de descarga
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "vocabulary.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="bg-white/90 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl text-purple-700">Gestión de Palabras</CardTitle>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} accept=".csv" onChange={handleImportCSV} className="hidden" />
          <Button variant="outline" size="sm" className="h-8" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Importar CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={generateCSV}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Tag className="h-4 w-4 mr-2" /> Categorías
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gestionar Categorías</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nueva categoría..."
                  />
                  <Button onClick={handleAddCategory} disabled={newCategory.trim() === ""}>
                    <Plus className="h-4 w-4 mr-1" /> Añadir
                  </Button>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="w-[100px] text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.length > 0 ? (
                        categories.map((category, index) => (
                          <TableRow key={index}>
                            <TableCell>{category}</TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-700"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Estás seguro de que quieres eliminar la categoría "{category}"? Las palabras de
                                      esta categoría se quedarán sin categoría asignada.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteCategory(category)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                            No hay categorías disponibles
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>Cerrar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <RefreshCw className="h-6 w-6 text-purple-600 animate-spin mr-2" />
            <span className="text-purple-600">Cargando datos...</span>
          </div>
        )}

        {/* Error message */}
        {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">{error}</div>}

        {/* Search, Filter and Add */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar palabras..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1) // Reset to first page on search
              }}
              className="pl-8"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value)
                setPage(1) // Reset to first page on category change
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category, index) => (
                  <SelectItem key={index} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" /> Añadir Palabra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Nueva Palabra</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-english">Palabra en Inglés</Label>
                  <Input
                    id="new-english"
                    value={newWord.english}
                    onChange={(e) => setNewWord({ ...newWord, english: e.target.value })}
                    placeholder="Escribe la palabra en inglés"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="new-spanish">Traducción al Español</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleTranslate}
                      disabled={newWord.english.trim() === "" || isTranslating}
                      className="h-6 px-2 text-xs"
                    >
                      {isTranslating ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Traducir
                    </Button>
                  </div>
                  <Input
                    id="new-spanish"
                    value={newWord.spanish}
                    onChange={(e) => setNewWord({ ...newWord, spanish: e.target.value })}
                    placeholder="Traducción al español (opcional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-category">Categoría</Label>
                  <Select
                    value={newWord.category}
                    onValueChange={(value) => setNewWord({ ...newWord, category: value })}
                  >
                    <SelectTrigger id="new-category">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categories.map((category, index) => (
                        <SelectItem key={index} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">
                    <X className="h-4 w-4 mr-2" /> Cancelar
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={handleAddWord} disabled={newWord.english.trim() === ""}>
                    <Save className="h-4 w-4 mr-2" /> Guardar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Words Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Inglés</TableHead>
                <TableHead className="w-[30%]">Español</TableHead>
                <TableHead className="w-[25%]">Categoría</TableHead>
                <TableHead className="w-[15%] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedWords.length > 0 ? (
                paginatedWords.map((word) => (
                  <TableRow key={word.id}>
                    <TableCell className="font-medium">{word.english}</TableCell>
                    <TableCell>{word.spanish}</TableCell>
                    <TableCell>
                      {word.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {word.category}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin categoría</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Palabra</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-english">Palabra en Inglés</Label>
                                <Input
                                  id="edit-english"
                                  value={editingWord?.english || word.english}
                                  onChange={(e) =>
                                    setEditingWord({
                                      id: word.id,
                                      english: e.target.value,
                                      spanish: editingWord?.spanish || word.spanish,
                                      category: editingWord?.category || word.category,
                                    })
                                  }
                                  onFocus={() => {
                                    if (!editingWord) {
                                      setEditingWord({
                                        id: word.id,
                                        english: word.english,
                                        spanish: word.spanish,
                                        category: word.category,
                                      })
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <Label htmlFor="edit-spanish">Traducción al Español</Label>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleTranslateEditing}
                                    disabled={!editingWord || editingWord.english.trim() === "" || isTranslating}
                                    className="h-6 px-2 text-xs"
                                  >
                                    {isTranslating ? (
                                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                    )}
                                    Traducir
                                  </Button>
                                </div>
                                <Input
                                  id="edit-spanish"
                                  value={editingWord?.spanish || word.spanish}
                                  onChange={(e) =>
                                    setEditingWord({
                                      id: word.id,
                                      english: editingWord?.english || word.english,
                                      spanish: e.target.value,
                                      category: editingWord?.category || word.category,
                                    })
                                  }
                                  onFocus={() => {
                                    if (!editingWord) {
                                      setEditingWord({
                                        id: word.id,
                                        english: word.english,
                                        spanish: word.spanish,
                                        category: word.category,
                                      })
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-category">Categoría</Label>
                                <Select
                                  value={editingWord?.category || word.category}
                                  onValueChange={(value) => {
                                    if (editingWord) {
                                      setEditingWord({
                                        ...editingWord,
                                        category: value,
                                      })
                                    } else {
                                      setEditingWord({
                                        id: word.id,
                                        english: word.english,
                                        spanish: word.spanish,
                                        category: value,
                                      })
                                    }
                                  }}
                                >
                                  <SelectTrigger id="edit-category">
                                    <SelectValue placeholder="Selecciona una categoría" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sin categoría</SelectItem>
                                    {categories.map((category, index) => (
                                      <SelectItem key={index} value={category}>
                                        {category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">
                                  <X className="h-4 w-4 mr-2" /> Cancelar
                                </Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button onClick={handleUpdateWord}>
                                  <Save className="h-4 w-4 mr-2" /> Guardar
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar palabra?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que quieres eliminar la palabra "{word.english}"? Esta acción no se
                                puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteWord(word.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                    {searchTerm || categoryFilter !== "all"
                      ? "No se encontraron palabras que coincidan con los criterios de búsqueda"
                      : "No hay palabras disponibles"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Mostrando {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, filteredWords.length)} de{" "}
              {filteredWords.length} palabras
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
        {/* Añadir el componente CSVImportHelper después de la tabla de palabras y antes del botón de eliminar todo */}
        {/* Añadir esto justo antes del AlertDialog para eliminar todo */}
        <div className="mt-6">
          <CSVImportHelper />
        </div>
        {/* Eliminar todo */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="mt-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
              <AlertTriangle className="h-4 w-4 mr-2" /> Eliminar todas las palabras y categorías
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar todo?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres eliminar TODAS las palabras y categorías? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAll} className="bg-red-500 hover:bg-red-600">
                Eliminar todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
