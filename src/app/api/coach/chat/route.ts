import { createClient } from "@/lib/supabase/server";
import { streamLLMMultiTurn, iterateStream, getProvider } from "@/lib/llm";
import { NextResponse } from "next/server";
import { getCoachSystemPrompt } from "@/lib/coaching-contexts";
import type { CoachContextData } from "@/lib/coaching-contexts";
import type { CoachChatRequest } from "@/types/coach";
import { abortControllers } from "@/lib/coach-abort-store";

export const maxDuration = 60;

// ── Helper: generate a short title from the first user message ──
function generateTitle(message: string): string {
  const firstSentence = message.split(/[.!?\n]/)[0]?.trim();
  if (firstSentence && firstSentence.length <= 50) return firstSentence;
  const truncated = message.slice(0, 50);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CoachChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    message,
    sessionId,
    coachMode,
    resumeId,
    tailoredResumeId,
    boardId,
    questionId,
  } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (!coachMode) {
    return NextResponse.json({ error: "Coach mode is required" }, { status: 400 });
  }

  // ── 1. Create requestId + AbortController ──
  const requestId = crypto.randomUUID();
  const abortController = new AbortController();
  abortControllers.set(requestId, abortController);

  // ── 2. Load conversation history ──
  let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  if (sessionId) {
    const { data: pastMessages } = await supabase
      .from('coach_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (pastMessages) {
      history = pastMessages as Array<{ role: 'user' | 'assistant'; content: string }>;
    }
  }

  // ── 3. Load context data from Supabase ──
  const contextData: CoachContextData = {};

  if (resumeId) {
    const { data: resume } = await supabase
      .from('resumes')
      .select('parsed_data')
      .eq('id', resumeId)
      .single();
    if (resume?.parsed_data) {
      contextData.resumeData = resume.parsed_data as Record<string, unknown>;
    }
  }

  if (tailoredResumeId) {
    const { data: tailored } = await supabase
      .from('tailored_resumes')
      .select('job_description, jd_analysis, tailored_data, match_score, skill_gap, cover_letter, dossier')
      .eq('id', tailoredResumeId)
      .single();
    if (tailored) {
      if (tailored.job_description) contextData.jobDescription = tailored.job_description;
      if (tailored.jd_analysis) contextData.jdAnalysis = tailored.jd_analysis as Record<string, unknown>;
      if (tailored.tailored_data) contextData.tailoredData = tailored.tailored_data as Record<string, unknown>;
      if (tailored.match_score) contextData.matchScore = tailored.match_score;
      if (tailored.skill_gap) contextData.skillGap = tailored.skill_gap as Record<string, unknown>;
      if (tailored.cover_letter) contextData.coverLetter = tailored.cover_letter;
      if (tailored.dossier && !contextData.dossier) contextData.dossier = tailored.dossier as Record<string, unknown>;
    }
  }

  if (boardId) {
    const { data: board } = await supabase
      .from('interview_boards')
      .select('modules, company_name, role, round_type, dossier')
      .eq('id', boardId)
      .single();
    if (board) {
      contextData.boardCompany = board.company_name;
      contextData.boardRole = board.role;
      contextData.boardRoundType = board.round_type;
      if (board.dossier) contextData.dossier = board.dossier as Record<string, unknown>;
      if (board.modules) {
        const modules = board.modules as Array<{
          title: string;
          cards: Array<{ num: number; q: string; a: string; qtype: string }>;
        }>;
        contextData.boardModules = modules;

        // Extract specific question if questionId provided
        if (questionId) {
          const qNum = parseInt(questionId, 10);
          for (const mod of modules) {
            const card = mod.cards.find((c) => c.num === qNum);
            if (card) {
              contextData.targetQuestion = { q: card.q, a: card.a || '' };
              break;
            }
          }
        }
      }
    }
  }

  // ── 4. Build system prompt ──
  const systemPrompt = getCoachSystemPrompt(coachMode, contextData);

  // ── 5. Create or verify session ──
  let actualSessionId = sessionId;
  let isFirstMessage = false;

  if (!sessionId) {
    // Create session on first message
    const { data: newSession, error: sessionError } = await supabase
      .from('coach_sessions')
      .insert({
        user_id: user.id,
        coach_mode: coachMode,
        resume_id: resumeId || null,
        tailored_resume_id: tailoredResumeId || null,
        board_id: boardId || null,
        message_count: 0,
      })
      .select('id')
      .single();

    if (sessionError || !newSession) {
      abortControllers.delete(requestId);
      return NextResponse.json(
        { error: sessionError?.message || "Failed to create session" },
        { status: 500 }
      );
    }

    actualSessionId = newSession.id;
    isFirstMessage = true;
  }

  // ── 6. Save user message ──
  await supabase.from('coach_messages').insert({
    session_id: actualSessionId,
    role: 'user',
    content: message.trim(),
  });

  // ── 7. Build messages array ──
  const messagesArray: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...history,
    { role: 'user', content: message.trim() },
  ];

  // ── 8. Stream response as NDJSON ──
  const provider = await getProvider(supabase, user.id);
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // Send system chunk with sessionId
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'system',
              sessionId: actualSessionId,
              coachMode,
              requestId,
            }) + '\n'
          )
        );

        // Call streaming API
        const { stream, getUsage } = streamLLMMultiTurn(provider, {
          system: systemPrompt,
          messages: messagesArray,
          maxTokens: 4096,
          signal: abortController.signal,
        });

        let fullAssistantResponse = '';

        for await (const text of iterateStream(stream)) {
          fullAssistantResponse += text;
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: 'assistant', text }) + '\n'
            )
          );
        }

        // Get token usage
        const usage = await getUsage();

        // Save assistant message to DB
        await supabase.from('coach_messages').insert({
          session_id: actualSessionId,
          role: 'assistant',
          content: fullAssistantResponse,
        });

        // Update session metadata
        const currentCount = history.length + 2; // existing + user + assistant
        const updates: Record<string, unknown> = {
          message_count: currentCount,
          updated_at: new Date().toISOString(),
        };

        // Auto-generate title from first message
        if (isFirstMessage) {
          updates.title = generateTitle(message);
        }

        await supabase
          .from('coach_sessions')
          .update(updates)
          .eq('id', actualSessionId);

        // Send done chunk with token usage
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'done',
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
            }) + '\n'
          )
        );

        controller.close();
      } catch (error) {
        if (abortController.signal.aborted) {
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'aborted' }) + '\n')
          );
        } else {
          const errorMsg =
            error instanceof Error ? error.message : 'Stream error';
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: 'error', message: errorMsg }) + '\n'
            )
          );
        }
        controller.close();
      } finally {
        abortControllers.delete(requestId);
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Request-Id': requestId,
    },
  });
}
