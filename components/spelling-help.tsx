"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Volume2, AlignJustify, HelpCircle, Lightbulb } from "lucide-react"

export default function SpellingHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Ayuda</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-600 flex items-center gap-2">
            <span className="text-xl">Spelling Bee - Cómo jugar</span>
          </DialogTitle>
          <DialogDescription>Aprende a deletrear palabras en inglés con el modo Spelling Bee</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-amber-500" />
              Escuchar la palabra completa
            </h3>
            <p className="text-sm text-gray-600">
              Pulsa el botón con el icono de altavoz para escuchar la pronunciación completa de la palabra.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <AlignJustify className="h-4 w-4 text-amber-500" />
              Escuchar el deletreo
            </h3>
            <p className="text-sm text-gray-600">
              Pulsa el botón con el icono de líneas para escuchar cada letra de la palabra deletreada en inglés.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Pedir una pista
            </h3>
            <p className="text-sm text-gray-600">
              Si necesitas ayuda, puedes pulsar el botón "Pista" para ver la primera letra de la palabra.
            </p>
          </div>

          <div className="bg-amber-50 p-3 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>Consejo:</strong> Escucha el deletreo varias veces para familiarizarte con los nombres de las
              letras en inglés. ¡Esto te ayudará a mejorar tu pronunciación y ortografía!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
