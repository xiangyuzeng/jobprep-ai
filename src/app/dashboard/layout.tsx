import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/layout/DashboardNav";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.tier as string) || "free";

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
        <DashboardNav userEmail={user.email || ""} tier={tier} />
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
