import Link from "next/link";
import {
  InkDivider,
  SealStamp,
  ScrollCard,
  MountainBackground,
  InkSplash,
  InkRevealWrapper,
} from "@/components/wuxia/WuxiaDecorations";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--paper-light)" }}>
      {/* Navigation */}
      <nav
        className="border-b"
        style={{
          background: "rgba(237, 230, 214, 0.92)",
          backdropFilter: "blur(10px)",
          borderColor: "var(--paper-dark)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <SealStamp size={28} />
              <span className="font-cinzel text-xl font-bold" style={{ color: "var(--ink-black)" }}>
                JobPrep AI
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--ink-mid)", textDecoration: "none" }}
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: "var(--vermillion)",
                  color: "var(--paper-light)",
                  borderRadius: 2,
                }}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: "90vh", display: "flex", alignItems: "center" }}>
        {/* Fog effects */}
        <div
          className="fog-drift absolute pointer-events-none"
          style={{
            top: "10%",
            left: "-10%",
            width: "60%",
            height: "60%",
            background: "radial-gradient(ellipse, rgba(237,230,214,0.5) 0%, transparent 70%)",
            zIndex: 0,
          }}
          aria-hidden="true"
        />
        <div
          className="fog-drift absolute pointer-events-none"
          style={{
            bottom: "15%",
            right: "-5%",
            width: "50%",
            height: "50%",
            background: "radial-gradient(ellipse, rgba(212,201,181,0.4) 0%, transparent 70%)",
            zIndex: 0,
            animationDelay: "4s",
          }}
          aria-hidden="true"
        />

        {/* Ink splashes */}
        <InkSplash
          variant={1}
          className="absolute hidden md:block"
          style={{ bottom: "10%", left: "3%", opacity: 0.08, width: 200 }}
        />
        <InkSplash
          variant={2}
          className="absolute hidden md:block"
          style={{ top: "8%", right: "3%", opacity: 0.06, width: 250 }}
        />

        {/* Mountain background */}
        <MountainBackground />

        {/* Hero content */}
        <div className="max-w-4xl mx-auto px-4 text-center relative" style={{ zIndex: 1 }}>
          <h1
            className="font-cinzel ink-bleed tracking-tight leading-tight"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 900,
              color: "var(--ink-black)",
            }}
          >
            The Interview Is Your Battlefield.
            <br />
            <span style={{ color: "var(--vermillion)" }}>Only the Prepared Survive.</span>
          </h1>
          <p
            className="mt-6 max-w-2xl mx-auto"
            style={{
              fontSize: "1.15rem",
              color: "var(--ink-mid)",
              fontStyle: "italic",
              lineHeight: 1.7,
              animation: "inkReveal 1.5s ease-out 0.8s both",
            }}
          >
            Master your craft. Sharpen your answers. Conquer every round.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center" style={{ animation: "inkReveal 1s ease-out 1.2s both" }}>
            <Link
              href="/auth/signup"
              className="px-8 py-3.5 text-lg font-semibold transition-all"
              style={{
                background: "var(--vermillion)",
                color: "var(--paper-light)",
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(194, 54, 22, 0.3)",
              }}
            >
              Begin Your Training
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 text-lg font-semibold transition-colors"
              style={{
                border: "1px solid var(--ink-faint)",
                color: "var(--ink-dark)",
                borderRadius: 2,
                background: "transparent",
                textDecoration: "none",
              }}
            >
              See How It Works
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 scroll-indicator" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto" style={{ opacity: 0.4 }}>
              <circle cx="12" cy="8" r="5" fill="var(--ink-dark)" opacity="0.6" />
              <ellipse cx="12" cy="16" rx="3" ry="4" fill="var(--ink-dark)" opacity="0.3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Ink Divider */}
      <InkDivider />

      {/* Features */}
      <section id="features" className="py-20 paper-texture" style={{ background: "var(--paper-cream)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <InkRevealWrapper className="text-center mb-16">
            <h2 className="font-cinzel text-3xl font-bold" style={{ color: "var(--ink-black)" }}>
              The Path of Mastery
            </h2>
            <p className="mt-4 text-lg" style={{ color: "var(--ink-light)", fontStyle: "italic" }}>
              Two disciplines, one platform.
            </p>
          </InkRevealWrapper>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Resume Tailoring Card */}
            <InkRevealWrapper delay={0.15}>
              <ScrollCard className="h-full">
                <div className="relative">
                  <h3 className="font-cinzel text-xl font-semibold mb-3" style={{ color: "var(--ink-black)" }}>
                    The Blade: AI Resume Tailoring
                  </h3>
                  <p className="mb-6" style={{ color: "var(--ink-mid)", lineHeight: 1.7 }}>
                    Upload your resume and paste any job description. Our AI
                    analyzes keyword matches, identifies skill gaps, and generates a
                    tailored version optimized for ATS systems.
                  </p>
                  <ul className="space-y-3 text-sm" style={{ color: "var(--ink-dark)" }}>
                    {[
                      "Match Rate scoring (0-100%) with keyword highlighting",
                      "Accept/reject individual suggestions with one click",
                      "Priority-ranked skill gap analysis",
                      "ATS-optimized PDF download + cover letter",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <img
                          src="/assets/wuxia/ink-dot-bullet.svg"
                          alt=""
                          width={10}
                          height={10}
                          className="mt-1.5 flex-shrink-0"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <InkSplash
                    variant={1}
                    className="absolute hidden md:block"
                    style={{ bottom: -20, right: -20, opacity: 0.04, width: 120 }}
                  />
                </div>
              </ScrollCard>
            </InkRevealWrapper>

            {/* Interview Board Card */}
            <InkRevealWrapper delay={0.3}>
              <ScrollCard className="h-full">
                <div className="relative">
                  <h3 className="font-cinzel text-xl font-semibold mb-3" style={{ color: "var(--ink-black)" }}>
                    Inner Strength: Interview Training Ground
                  </h3>
                  <p className="mb-6" style={{ color: "var(--ink-mid)", lineHeight: 1.7 }}>
                    AI generates 40-80 interview questions with detailed answers,
                    organized by topic. Practice technical, behavioral, and culture
                    questions tailored to your target company and role.
                  </p>
                  <ul className="space-y-3 text-sm" style={{ color: "var(--ink-dark)" }}>
                    {[
                      "40-80 questions per board across 6-10 topic modules",
                      "STAR-format answers with real examples",
                      "Interactive board with search, filters, progress tracking",
                      "Technical, HR, CEO, and general round support",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <img
                          src="/assets/wuxia/ink-dot-bullet.svg"
                          alt=""
                          width={10}
                          height={10}
                          className="mt-1.5 flex-shrink-0"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <InkSplash
                    variant={2}
                    className="absolute hidden md:block"
                    style={{ bottom: -20, right: -20, opacity: 0.04, width: 140 }}
                  />
                </div>
              </ScrollCard>
            </InkRevealWrapper>
          </div>
        </div>
      </section>

      {/* Ink Divider */}
      <InkDivider />

      {/* How It Works */}
      <section className="py-20" style={{ background: "var(--paper-light)" }}>
        <div className="max-w-5xl mx-auto px-4">
          <InkRevealWrapper>
            <h2 className="font-cinzel text-3xl font-bold text-center mb-16" style={{ color: "var(--ink-black)" }}>
              The Way of Preparation
            </h2>
          </InkRevealWrapper>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line (hidden on mobile) */}
            <div
              className="hidden md:block absolute pointer-events-none"
              style={{
                top: 55,
                left: "20%",
                right: "20%",
                height: 2,
                background: "linear-gradient(to right, transparent, var(--ink-faint), transparent)",
                opacity: 0.4,
              }}
              aria-hidden="true"
            />

            {[
              {
                step: "1",
                title: "Upload Your Resume",
                desc: "Submit your scroll of accomplishments. Our AI parses and structures your experience.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ink-dark)" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
              },
              {
                step: "2",
                title: "Define Your Target",
                desc: "Paste any job posting. AI analyzes requirements, keywords, and skill matches instantly.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ink-dark)" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="12" cy="12" r="1.5" fill="var(--vermillion)" stroke="none" />
                  </svg>
                ),
              },
              {
                step: "3",
                title: "Claim Your Battle Kit",
                desc: "Download your optimized resume, cover letter, and a complete interview prep board.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ink-dark)" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
              },
            ].map((item, idx) => (
              <InkRevealWrapper key={item.step} delay={idx * 0.2} className="text-center relative z-10">
                <div
                  className="mx-auto mb-4 flex items-center justify-center"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "47% 53% 49% 51%",
                    border: "2px solid var(--ink-dark)",
                    background: "var(--paper-cream)",
                  }}
                >
                  {item.icon}
                </div>
                <div
                  className="font-cinzel text-sm font-bold mb-2"
                  style={{ color: "var(--vermillion)" }}
                >
                  Step {item.step}
                </div>
                <h3 className="font-cinzel text-lg font-semibold mb-2" style={{ color: "var(--ink-black)" }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--ink-mid)", lineHeight: 1.6 }}>{item.desc}</p>
              </InkRevealWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <InkRevealWrapper>
        <section
          className="py-20 paper-texture relative overflow-hidden"
          style={{
            background: "var(--paper-cream)",
            boxShadow: "inset 0 0 100px rgba(26,26,26,0.06)",
          }}
        >
          <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
            <h2 className="font-cinzel text-3xl font-bold mb-4" style={{ color: "var(--ink-black)" }}>
              Hero &mdash; Your Journey Begins Here
            </h2>
            <p className="text-lg mb-8" style={{ color: "var(--ink-mid)", fontStyle: "italic", lineHeight: 1.7 }}>
              Thousands of warriors have sharpened their skills on this ground. Join them.
            </p>
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-3.5 text-lg font-semibold transition-all"
              style={{
                background: "var(--vermillion)",
                color: "var(--paper-light)",
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(194, 54, 22, 0.3)",
              }}
            >
              Enter the Arena
            </Link>
          </div>
          <SealStamp
            size={80}
            className="absolute hidden md:block"
            style={{ bottom: 20, right: 40, opacity: 0.12 }}
          />
        </section>
      </InkRevealWrapper>

      {/* Footer */}
      <footer style={{ background: "var(--ink-dark)", borderTop: "1px solid var(--ink-mid)" }}>
        <InkDivider opacity={0.15} />
        <div className="max-w-7xl mx-auto px-4 text-center text-sm pb-8" style={{ color: "var(--paper-dark)" }}>
          &copy; {new Date().getFullYear()} JobPrep AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
