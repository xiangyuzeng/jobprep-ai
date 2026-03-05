import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { generateResumePDF } from "@/lib/pdf-generator";

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

    const { tailoredResumeId, acceptedSuggestionIds } = await request.json();

    if (!tailoredResumeId) {
      return NextResponse.json(
        { error: "Tailored resume ID is required" },
        { status: 400 }
      );
    }

    // Fetch tailored resume + original resume
    const { data: tailored, error: dbError } = await supabase
      .from("tailored_resumes")
      .select("*, resumes(parsed_data)")
      .eq("id", tailoredResumeId)
      .eq("user_id", user.id)
      .single();

    if (dbError || !tailored) {
      return NextResponse.json(
        { error: "Tailored resume not found" },
        { status: 404 }
      );
    }

    // Apply accepted suggestions to the resume data
    const resumeData = { ...tailored.resumes.parsed_data };
    const suggestions = tailored.tailored_data || [];
    const acceptedIds = new Set(acceptedSuggestionIds || []);

    for (const suggestion of suggestions) {
      if (!acceptedIds.has(suggestion.id)) continue;

      if (suggestion.type === "summary_rewrite") {
        resumeData.summary = suggestion.replacement;
      } else if (suggestion.section === "skills") {
        // Replace or add skills
        if (suggestion.type === "skill_match" && suggestion.replacement) {
          const skills = new Set(resumeData.skills || []);
          if (suggestion.original) skills.delete(suggestion.original);
          suggestion.replacement.split(",").forEach((s: string) => skills.add(s.trim()));
          resumeData.skills = Array.from(skills);
        }
      } else if (
        suggestion.section === "experience" &&
        suggestion.experienceIndex !== undefined
      ) {
        const exp = resumeData.experience?.[suggestion.experienceIndex];
        if (exp) {
          if (suggestion.type === "title_align") {
            exp.title = suggestion.replacement;
          } else if (suggestion.bulletIndex !== undefined && exp.bullets) {
            exp.bullets[suggestion.bulletIndex] = suggestion.replacement;
          }
        }
      }
    }

    // Generate PDF
    const pdfDocument = generateResumePDF(resumeData);
    const pdfBuffer = await renderToBuffer(pdfDocument);

    // Store in Supabase Storage
    const pdfPath = `${user.id}/${tailoredResumeId}.pdf`;
    await supabase.storage.from("pdfs").upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

    await supabase
      .from("tailored_resumes")
      .update({ pdf_path: pdfPath })
      .eq("id", tailoredResumeId);

    // Return PDF as download
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${resumeData.name || "Resume"}_Tailored.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
