import { createClient } from "@/lib/supabase/server";
import { buildCompanyDossier } from "@/lib/dossier";
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

    const { companyName, jobDescription } = await request.json();

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const companyNameLower = companyName.trim().toLowerCase();

    // Check cache — 7-day TTL
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: cached } = await supabase
      .from("company_dossiers")
      .select("dossier")
      .eq("user_id", user.id)
      .eq("company_name_lower", companyNameLower)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      return NextResponse.json({ dossier: cached.dossier, cached: true });
    }

    // Build fresh dossier
    const dossier = await buildCompanyDossier(companyName, jobDescription);

    // Cache the result
    await supabase.from("company_dossiers").insert({
      user_id: user.id,
      company_name_lower: companyNameLower,
      dossier,
    });

    return NextResponse.json({ dossier, cached: false });
  } catch (err) {
    console.error("Dossier build error:", err);
    return NextResponse.json(
      {
        dossier: null,
        error: err instanceof Error ? err.message : "Failed to build dossier",
      },
      { status: 500 }
    );
  }
}
