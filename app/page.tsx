import VocabularyGame from "@/components/vocabulary-game"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <VocabularyGame />
      </div>
    </main>
  )
}
