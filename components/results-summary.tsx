"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import type { WordResult } from "./vocabulary-game"

type ResultsSummaryProps = {
  wordResults: WordResult[]
  totalWords: number
  score: number
  onContinue: () => void
}

export default function ResultsSummary({ wordResults, totalWords, score, onContinue }: ResultsSummaryProps) {
  return (
    <Card className="bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl text-center text-purple-700">
          Resumen del Examen: {score} / {totalWords} correctas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-3 text-left text-sm font-medium text-gray-700">Español</th>
                <th className="py-2 px-3 text-left text-sm font-medium text-gray-700">Inglés</th>
                <th className="py-2 px-3 text-left text-sm font-medium text-gray-700">Tu respuesta</th>
                <th className="py-2 px-3 text-center text-sm font-medium text-gray-700">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {wordResults.map((result, index) => (
                <tr key={index} className={result.correct ? "bg-green-50" : "bg-red-50"}>
                  <td className="py-3 px-3 text-sm">{result.spanish}</td>
                  <td className="py-3 px-3 text-sm font-medium">{result.english}</td>
                  <td className="py-3 px-3 text-sm">
                    {result.userAnswer || <span className="text-gray-400">(sin respuesta)</span>}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {result.correct ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                        <Check className="h-4 w-4 text-green-600" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                        <X className="h-4 w-4 text-red-600" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center p-4">
        <Button
          onClick={onContinue}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8 py-2"
        >
          Continuar
        </Button>
      </CardFooter>
    </Card>
  )
}
