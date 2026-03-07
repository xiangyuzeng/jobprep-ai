import { createClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/resume-parser";
import { streamLLM, iterateStream, getProvider } from "@/lib/llm";
import { RESUME_PARSER_PROMPT } from "@/lib/prompts/resume-parser";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Extract text from file
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromFile(buffer, file.name);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from file. Please try a different format." },
        { status: 400 }
      );
    }

    // Upload original file to Supabase Storage
    const storagePath = `${user.id}/${Date.now()}-${file.name}`;
    await supabase.storage.from("resumes").upload(storagePath, buffer, {
      contentType: file.type,
    });

    // Parse resume with LLM
    const provider = await getProvider(supabase, user.id);
    const stream = await streamLLM(provider, {
      systemPrompt: RESUME_PARSER_PROMPT,
      userMessage: text,
      maxTokens: 4096,
    });

    let fullResponse = "";
    for await (const text of iterateStream(stream)) {
      fullResponse += text;
    }

    // Extract JSON from response
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse resume structure" },
        { status: 500 }
      );
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Save to database
    const { data: resume, error: dbError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        original_filename: file.name,
        parsed_data: parsedData,
        storage_path: storagePath,
      })
      .select("id")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ resumeId: resume.id, parsedData });
  } catch (err) {
    console.error("Resume parse error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
