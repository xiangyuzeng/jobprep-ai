import { NextResponse } from "next/server";
import { abortControllers } from "@/lib/coach-abort-store";

// POST /api/coach/abort — abort an in-progress streaming request
export async function POST(request: Request) {
  let body: { requestId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { requestId } = body;

  if (!requestId) {
    return NextResponse.json(
      { error: "requestId is required" },
      { status: 400 }
    );
  }

  const controller = abortControllers.get(requestId);
  if (controller) {
    controller.abort();
    abortControllers.delete(requestId);
    return NextResponse.json({ success: true, aborted: true });
  }

  // Controller not found — may have already completed or been cleaned up
  return NextResponse.json({ success: true, aborted: false });
}
