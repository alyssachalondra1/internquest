import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  const { imageBase64, mimeType } = await req.json()

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          company_name: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          location: { type: SchemaType.STRING },
          deadline: { type: SchemaType.STRING },
          start_date: { type: SchemaType.STRING },
          duration_months: { type: SchemaType.NUMBER },
          work_type: { type: SchemaType.STRING },
          is_paid: { type: SchemaType.BOOLEAN },
        },
      },
    },
  })

  const result = await model.generateContent([
    {
      text:
        "Baca poster lowongan magang ini dan ambil datanya. " +
        "Jika sebuah field tidak tertera, kosongkan (jangan mengarang). " +
        "Tanggal pakai format YYYY-MM-DD.",
    },
    { inlineData: { data: imageBase64, mimeType } },
  ])

  const data = JSON.parse(result.response.text())
  return NextResponse.json(data)
}