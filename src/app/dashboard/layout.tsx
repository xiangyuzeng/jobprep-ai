import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--paper-light)" }}>
      <nav
        className="border-b"
        style={{
          background: "rgba(237, 230, 214, 0.92)",
          backdropFilter: "blur(10px)",
          borderColor: "var(--paper-dark)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-8">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                style={{ textDecoration: "none" }}
              >
                <Image
                  src="/assets/wuxia/seal-stamp.svg"
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden="true"
                />
                <span className="font-cinzel text-lg font-bold" style={{ color: "var(--ink-black)" }}>
                  JobPrep AI
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-sm rounded-sm transition-colors"
                  style={{ color: "var(--ink-mid)", textDecoration: "none" }}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/resume"
                  className="px-3 py-1.5 text-sm rounded-sm transition-colors"
                  style={{ color: "var(--ink-mid)", textDecoration: "none" }}
                >
                  Resume
                </Link>
                <Link
                  href="/dashboard/prepare"
                  className="px-3 py-1.5 text-sm rounded-sm transition-colors"
                  style={{ color: "var(--ink-mid)", textDecoration: "none" }}
                >
                  Quick Prepare
                </Link>
                <Link
                  href="/dashboard/coach"
                  className="px-3 py-1.5 text-sm rounded-sm transition-colors"
                  style={{ color: "var(--ink-mid)", textDecoration: "none" }}
                >
                  AI Coach
                </Link>
                <Link
                  href="/dashboard/interview"
                  className="px-3 py-1.5 text-sm rounded-sm transition-colors"
                  style={{ color: "var(--ink-mid)", textDecoration: "none" }}
                >
                  Interview Prep
                </Link>
                <Link
                  href="/dashboard/simulator"
                  className="px-3 py-1.5 text-sm rounded-sm transition-colors"
                  style={{ color: "var(--ink-mid)", textDecoration: "none" }}
                >
                  Mock Interview
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm" style={{ color: "var(--ink-light)" }}>{user.email}</span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm transition-colors"
                  style={{ color: "var(--ink-light)" }}
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
