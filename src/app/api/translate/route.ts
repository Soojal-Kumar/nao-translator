// src/app/api/translate/route.ts
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  // Configuration to reduce chances of blocking medical terms
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ];

  try {
    const { text, fromLanguage, toLanguage } = await req.json();

    if (!text || !fromLanguage || !toLanguage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get full language names for a more robust prompt
    const fromLangName = new Intl.DisplayNames(["en"], { type: "language" }).of(
      fromLanguage.split("-")[0]
    );
    const toLangName = new Intl.DisplayNames(["en"], { type: "language" }).of(
      toLanguage.split("-")[0]
    );

    const prompt = `
      You are an expert translator specializing in healthcare and medical terminology.
      Translate the following text from ${fromLangName} to ${toLangName}.
      The context is a conversation between a patient and a healthcare provider.
      It is critical to be accurate with medical terms.
      Do not add any commentary, explanations, or extra text. Return ONLY the translation.
      
      Original Text: "${text}"
      
      Translated Text:
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
    });
    const response = result.response;
    const translatedText = response.text().trim();

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("Error in translation API:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
}
