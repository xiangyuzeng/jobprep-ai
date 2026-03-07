import Link from "next/link";
import Image from "next/image";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: "var(--paper-light)" }}>
      {/* Demo banner */}
      <div
        style={{
          background: "#c9a84c",
          color: "#fff",
          textAlign: "center",
          padding: "6px 16px",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Demo Mode — Try JobPrep AI without an account
      </div>

      {/* Nav */}
      <nav
        className="border-b"
        style={{
          background: "rgba(237, 230, 214, 0.92)",
          backdropFilter: "blur(10px)",
          borderColor: "var(--paper-dark)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            <Link
              href="/"
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
              <span
                className="font-cinzel text-lg font-bold"
                style={{ color: "var(--ink-black)" }}
              >
                JobPrep AI
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm"
                style={{ color: "var(--ink-mid)", textDecoration: "none" }}
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm px-4 py-1.5 rounded-sm"
                style={{
                  background: "var(--vermillion)",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
