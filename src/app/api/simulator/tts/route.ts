import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 30;

export async function POST(request: Request) {
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  const body = await request.json();
  const { text, voice = "onyx" } = body as {
    text: string;
    voice?: "nova" | "onyx" | "echo" | "alloy" | "fable" | "shimmer";
  };

  if (!text?.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  // 3. Check for OpenAI API key — return 503 so client falls back to browser TTS
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "TTS not configured — use browser fallback" },
      { status: 503 }
    );
  }

  try {
    // 4. Call OpenAI TTS
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as "nova" | "onyx" | "echo" | "alloy" | "fable" | "shimmer",
      input: text.slice(0, 4096), // TTS input limit
      response_format: "mp3",
    });

    // 5. Return binary audio stream
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "TTS generation failed" },
      { status: 500 }
    );
  }
}
