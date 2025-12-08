import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real application, you would load this from a database
    // For this example, we're using the data directly from the component
    // but in a production app, you'd use this API route

    const data = {
      vocabulary: [
        { english: "dog", spanish: "perro" },
        { english: "cat", spanish: "gato" },
        { english: "house", spanish: "casa" },
        { english: "tree", spanish: "árbol" },
        { english: "book", spanish: "libro" },
        { english: "school", spanish: "escuela" },
        { english: "friend", spanish: "amigo" },
        { english: "family", spanish: "familia" },
        { english: "water", spanish: "agua" },
        { english: "food", spanish: "comida" },
        { english: "one", spanish: "uno" },
        { english: "two", spanish: "dos" },
        { english: "three", spanish: "tres" },
        { english: "red", spanish: "rojo" },
        { english: "blue", spanish: "azul" },
        { english: "green", spanish: "verde" },
        { english: "yellow", spanish: "amarillo" },
        { english: "apple", spanish: "manzana" },
        { english: "banana", spanish: "plátano" },
        { english: "car", spanish: "coche" },
        { english: "ball", spanish: "pelota" },
        { english: "boy", spanish: "niño" },
        { english: "girl", spanish: "niña" },
        { english: "mother", spanish: "madre" },
        { english: "father", spanish: "padre" },
        // Added more sample words for the API response
      ],
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to load vocabulary data" }, { status: 500 })
  }
}
