import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <span className="text-xl font-bold text-gray-900">JobPrep AI</span>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
            Ace Your Next Interview.
            <br />
            <span className="text-blue-600">Land the Job.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto">
            AI-powered resume tailoring and interview preparation. Upload your
            resume, paste a job description, and get everything you need to
            succeed.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-blue-600 text-white px-8 py-3.5 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Start for Free
            </Link>
            <a
              href="#features"
              className="border border-gray-300 text-gray-700 px-8 py-3.5 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Two powerful tools, one platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Resume Tailoring Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI Resume Tailoring
              </h3>
              <p className="text-gray-500 mb-6">
                Upload your resume and paste any job description. Our AI
                analyzes keyword matches, identifies skill gaps, and generates a
                tailored version optimized for ATS systems.
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  "Match Rate scoring (0-100%) with keyword highlighting",
                  "Accept/reject individual suggestions with one click",
                  "Priority-ranked skill gap analysis",
                  "ATS-optimized PDF download + cover letter",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Interview Board Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Interview Prep Board
              </h3>
              <p className="text-gray-500 mb-6">
                AI generates 40-80 interview questions with detailed answers,
                organized by topic. Practice technical, behavioral, and culture
                questions tailored to your target company and role.
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  "40-80 questions per board across 6-10 topic modules",
                  "STAR-format answers with real examples",
                  "Interactive board with search, filters, progress tracking",
                  "Technical, HR, CEO, and general round support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Upload Your Resume",
                desc: "Upload your existing resume as PDF or DOCX. Our AI parses and structures your experience.",
              },
              {
                step: "2",
                title: "Paste the Job Description",
                desc: "Paste any job posting. AI analyzes requirements, keywords, and skill matches instantly.",
              },
              {
                step: "3",
                title: "Get Tailored Results",
                desc: "Download your optimized resume, cover letter, and a complete interview prep board.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of job seekers who use AI to stand out from the crowd.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-blue-600 px-8 py-3.5 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} JobPrep AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
