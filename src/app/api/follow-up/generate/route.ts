import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callLLM, getProvider } from "@/lib/llm";
import { formatDossierContext, type CompanyDossier } from "@/lib/dossier";
import { THANK_YOU_EMAIL_PROMPT } from "@/lib/prompts/thank-you-email";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await getProvider(supabase, user.id);
  const body = await request.json();
  const { sessionId, boardId, companyName, role, interviewerName, additionalContext } = body;

  if (!companyName || !role) {
    return NextResponse.json({ error: "companyName and role are required" }, { status: 400 });
  }

  const contextParts: string[] = [];
  contextParts.push(`Company: ${companyName}`);
  contextParts.push(`Role: ${role}`);
  if (interviewerName) {
    contextParts.push(`Interviewer: ${interviewerName}`);
  }

  // Build discussion summary from simulator session
  if (sessionId) {
    const { data: answers } = await supabase
      .from("simulator_answers")
      .select("question_text, transcript, ai_feedback, relevance_score, specificity_score, content_score")
      .eq("session_id", sessionId)
      .order("question_index", { ascending: true });

    if (answers && answers.length > 0) {
      const discussionSummary = answers
        .map((a, i) => {
          let entry = `Q${i + 1}: ${a.question_text}`;
          if (a.transcript) {
            entry += `\nCandidate response: ${a.transcript}`;
          }
          if (a.ai_feedback) {
            entry += `\nFeedback: ${a.ai_feedback}`;
          }
          const scores: string[] = [];
          if (a.relevance_score != null) scores.push(`relevance: ${a.relevance_score}/10`);
          if (a.specificity_score != null) scores.push(`specificity: ${a.specificity_score}/10`);
          if (a.content_score != null) scores.push(`content: ${a.content_score}/10`);
          if (scores.length > 0) {
            entry += `\nScores: ${scores.join(", ")}`;
          }
          return entry;
        })
        .join("\n\n");

      contextParts.push(`\n<interview_discussion>\n${discussionSummary}\n</interview_discussion>`);
    }
  }

  // Fetch board data for dossier and question context
  let dossierContext = "";
  if (boardId) {
    const { data: board } = await supabase
      .from("interview_boards")
      .select("company_name, role, modules, dossier")
      .eq("id", boardId)
      .eq("user_id", user.id)
      .single();

    if (board) {
      // Add dossier context if available
      if (board.dossier) {
        try {
          dossierContext = formatDossierContext(board.dossier as CompanyDossier);
        } catch {
          // Dossier format issue — continue without it
        }
      }

      // If no session data, use board modules as likely discussion topics
      if (!sessionId && board.modules) {
        const modules = board.modules as Array<{
          title: string;
          cards?: Array<{ q: string }>;
        }>;
        const topicSummary = modules
          .map((m) => {
            const topQuestions = (m.cards || []).slice(0, 3).map((c) => c.q);
            return `${m.title}: ${topQuestions.join("; ")}`;
          })
          .join("\n");

        contextParts.push(
          `\n<likely_discussion_topics>\nThese are topics the candidate likely discussed during the interview:\n${topicSummary}\n</likely_discussion_topics>`
        );
      }
    }
  }

  if (dossierContext) {
    contextParts.push(`\n${dossierContext}`);
  }

  if (additionalContext) {
    contextParts.push(`\nAdditional context from the candidate: ${additionalContext}`);
  }

  const userMessage = contextParts.join("\n");

  try {
    const responseText = await callLLM(provider, {
      systemPrompt: THANK_YOU_EMAIL_PROMPT,
      userMessage,
      maxTokens: 1024,
    });

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse email response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      subject: parsed.subject || "",
      body: parsed.body || "",
      keyPoints: parsed.key_points_referenced || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate email" },
      { status: 500 }
    );
  }
}
