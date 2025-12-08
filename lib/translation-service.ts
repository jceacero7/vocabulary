// This is a mock translation service
// In a real application, you would use an actual translation API

// Updated dictionary with clothing items and colors
const dictionary: Record<string, string> = {
  // Clothing items
  bag: "bolsa",
  clothes: "ropa",
  dress: "vestido",
  glasses: "gafas",
  handbag: "bolso",
  hay: "sombrero",
  jacket: "chaqueta",
  jeans: "vaqueros",
  "baseball cap": "gorra",
  shorts: "pantalones cortos",
  shirt: "camisa",
  shoe: "zapato",
  skirt: "falda",
  sock: "calcetines",
  trousers: "pantalón",
  "t-shirt": "camiseta",
  watch: "reloj",
  wear: "llevar",
  boots: "botas",

  // Colors
  black: "negro",
  blue: "azul",
  brown: "marrón",
  colour: "color",
  green: "verde",
  grey: "gris",
  orange: "naranja",
  pink: "rosa",
  purple: "morado",
  red: "rojo",
  white: "blanco",
  yellow: "amarillo",
}

export async function translateWord(englishWord: string): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const word = englishWord.toLowerCase().trim()

  // Check if word exists in our dictionary
  if (dictionary[word]) {
    return dictionary[word]
  }

  // If not found, return a placeholder
  return `[Traducción no disponible para "${englishWord}"]`

  // In a real application, you would call an actual translation API:
  // const response = await fetch(`https://translation-api.example.com/translate?text=${encodeURIComponent(englishWord)}&from=en&to=es`)
  // const data = await response.json()
  // return data.translation
}
