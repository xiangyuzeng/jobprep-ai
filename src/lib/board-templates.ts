// Board templates — pre-built question sets for popular companies
// Templates contain questions only; answers are generated per-user via existing answer generation flow

export interface BoardTemplate {
  id: string;
  company: string;
  role: string;
  roundType: string;
  language: string;
  description: string;
  questionCount: number;
  moduleCount: number;
  sources: string[];
  tags: string[];
  boardType: string;
  qtypes: Record<string, string>;
  modules: Array<{
    title: string;
    cards: Array<{ num: number; q: string; qtype: string }>;
  }>;
}

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "swe-technical-general",
    company: "Tech Company",
    role: "Senior Software Engineer",
    roundType: "technical",
    language: "en",
    description:
      "45 technical interview questions covering system design, coding, and behavioral topics for senior SWE roles",
    questionCount: 45,
    moduleCount: 5,
    sources: ["Glassdoor", "Blind", "interviewing.io"],
    tags: ["Engineering", "Backend", "System Design", "Full Stack"],
    boardType: "technical",
    qtypes: { B: "Behavioral", T: "Technical", P: "Problem", C: "Culture" },
    modules: [
      {
        title: "🧠 System Design & Architecture",
        cards: [
          { num: 1, q: "Design a URL shortening service like bit.ly. How would you handle billions of URLs?", qtype: "T" },
          { num: 2, q: "How would you design a rate limiter for an API gateway? Discuss different algorithms.", qtype: "T" },
          { num: 3, q: "Walk me through how you would design a real-time chat system supporting millions of concurrent users.", qtype: "T" },
          { num: 4, q: "Design a distributed cache system. How do you handle cache invalidation and consistency?", qtype: "T" },
          { num: 5, q: "How would you design a notification system that handles email, SMS, and push notifications?", qtype: "T" },
          { num: 6, q: "Describe how you would architect a search engine for an e-commerce platform.", qtype: "T" },
          { num: 7, q: "Design a job scheduling system that can handle millions of tasks per day.", qtype: "T" },
          { num: 8, q: "How would you design a content delivery network (CDN)? What are the key challenges?", qtype: "T" },
          { num: 9, q: "Walk through your approach to designing a payment processing system.", qtype: "T" },
        ],
      },
      {
        title: "💡 Problem Solving & Algorithms",
        cards: [
          { num: 10, q: "You discover a production database query is taking 30 seconds. Walk me through your debugging and optimization process.", qtype: "P" },
          { num: 11, q: "How would you handle a situation where your service is experiencing cascading failures?", qtype: "P" },
          { num: 12, q: "Describe your approach to migrating a monolithic application to microservices.", qtype: "P" },
          { num: 13, q: "You need to process 10TB of log data daily. Design the data pipeline.", qtype: "P" },
          { num: 14, q: "How would you implement a feature flag system that supports gradual rollouts?", qtype: "P" },
          { num: 15, q: "Your API response times have degraded by 3x over the past month. How do you investigate?", qtype: "P" },
          { num: 16, q: "Design an approach for handling data consistency across multiple microservices.", qtype: "P" },
          { num: 17, q: "How would you implement an efficient full-text search without using Elasticsearch?", qtype: "P" },
          { num: 18, q: "Describe your strategy for handling database schema migrations with zero downtime.", qtype: "P" },
        ],
      },
      {
        title: "🛠️ Backend & Infrastructure",
        cards: [
          { num: 19, q: "Explain the differences between SQL and NoSQL databases. When would you choose one over the other?", qtype: "T" },
          { num: 20, q: "How do you ensure high availability in a distributed system? Discuss redundancy strategies.", qtype: "T" },
          { num: 21, q: "Explain the CAP theorem and how it influences your architecture decisions.", qtype: "T" },
          { num: 22, q: "How would you implement CI/CD pipelines for a team of 50 engineers?", qtype: "T" },
          { num: 23, q: "Describe your experience with container orchestration. How do you handle scaling?", qtype: "T" },
          { num: 24, q: "What monitoring and observability tools have you used? How do you set up alerting?", qtype: "T" },
          { num: 25, q: "Explain how you handle secrets management in a microservices architecture.", qtype: "T" },
          { num: 26, q: "How do you approach API versioning and backward compatibility?", qtype: "T" },
          { num: 27, q: "Describe your experience with message queues. When would you use Kafka vs RabbitMQ?", qtype: "T" },
        ],
      },
      {
        title: "💬 Behavioral & Leadership",
        cards: [
          { num: 28, q: "Tell me about a time you had to make a critical technical decision under pressure.", qtype: "B" },
          { num: 29, q: "Describe a project where you disagreed with your team's technical direction. How did you handle it?", qtype: "B" },
          { num: 30, q: "Tell me about a production incident you led the response for. What did you learn?", qtype: "B" },
          { num: 31, q: "How do you mentor junior engineers? Give me a specific example.", qtype: "B" },
          { num: 32, q: "Describe a time when you had to deliver bad news to stakeholders about a project delay.", qtype: "B" },
          { num: 33, q: "Tell me about a time you identified and addressed a significant technical debt.", qtype: "B" },
          { num: 34, q: "How do you balance feature development with engineering quality?", qtype: "B" },
          { num: 35, q: "Describe your approach to code reviews. What do you look for?", qtype: "B" },
          { num: 36, q: "Tell me about a time you had to learn a new technology quickly for a project.", qtype: "B" },
        ],
      },
      {
        title: "🎭 Culture Fit & Career",
        cards: [
          { num: 37, q: "Why are you looking for a new role right now?", qtype: "C" },
          { num: 38, q: "What does your ideal engineering culture look like?", qtype: "C" },
          { num: 39, q: "How do you stay current with new technologies and industry trends?", qtype: "C" },
          { num: 40, q: "What is your management style preference? How do you like to be managed?", qtype: "C" },
          { num: 41, q: "Where do you see yourself in 3-5 years?", qtype: "C" },
          { num: 42, q: "What was the most challenging project you worked on and why?", qtype: "C" },
          { num: 43, q: "How do you handle working in a fast-paced environment with shifting priorities?", qtype: "C" },
          { num: 44, q: "What are you looking for in your next team?", qtype: "C" },
          { num: 45, q: "Tell me about a side project or open-source contribution you are proud of.", qtype: "C" },
        ],
      },
    ],
  },
  {
    id: "pm-hr-behavioral",
    company: "Tech Company",
    role: "Product Manager",
    roundType: "hr",
    language: "en",
    description:
      "30 HR and behavioral interview questions for Product Manager roles covering leadership, strategy, and culture fit",
    questionCount: 30,
    moduleCount: 4,
    sources: ["Glassdoor", "Blind"],
    tags: ["Product", "Management", "Strategy", "Leadership"],
    boardType: "behavioral",
    qtypes: { B: "Behavioral", S: "Scenario", C: "Culture", T: "Technical" },
    modules: [
      {
        title: "💬 Background & Motivation",
        cards: [
          { num: 1, q: "Walk me through your career journey. What led you to product management?", qtype: "B" },
          { num: 2, q: "Why are you interested in this company and this specific PM role?", qtype: "B" },
          { num: 3, q: "Tell me about a product you built from 0 to 1. What was your process?", qtype: "B" },
          { num: 4, q: "Describe your experience working with engineering teams. How do you build trust?", qtype: "B" },
          { num: 5, q: "What is your approach to prioritization? How do you decide what to build next?", qtype: "B" },
          { num: 6, q: "Tell me about a time you had to pivot a product strategy based on user feedback.", qtype: "B" },
          { num: 7, q: "How do you define and measure product success?", qtype: "B" },
          { num: 8, q: "Describe a product decision you made that you later realized was wrong.", qtype: "B" },
        ],
      },
      {
        title: "🔍 Scenario & Problem Solving",
        cards: [
          { num: 9, q: "Your key metric dropped 20% overnight. Walk me through your investigation process.", qtype: "S" },
          { num: 10, q: "Engineering says the feature you want will take 6 months. You have 2 months. What do you do?", qtype: "S" },
          { num: 11, q: "Two senior stakeholders want conflicting features. How do you resolve this?", qtype: "S" },
          { num: 12, q: "You just launched a feature and user feedback is overwhelmingly negative. What are your next steps?", qtype: "S" },
          { num: 13, q: "How would you approach entering a new market segment with your product?", qtype: "S" },
          { num: 14, q: "A competitor just launched a feature similar to what you had planned. How do you respond?", qtype: "S" },
          { num: 15, q: "Your CEO wants to add a feature that conflicts with user research findings. How do you handle this?", qtype: "S" },
          { num: 16, q: "You have limited resources. How do you decide between fixing technical debt and building new features?", qtype: "S" },
        ],
      },
      {
        title: "👥 Leadership & Collaboration",
        cards: [
          { num: 17, q: "Tell me about a time you influenced a team without having direct authority.", qtype: "B" },
          { num: 18, q: "How do you handle disagreements with your engineering lead?", qtype: "B" },
          { num: 19, q: "Describe a time you had to communicate a difficult product decision to your team.", qtype: "B" },
          { num: 20, q: "How do you ensure alignment across design, engineering, and business teams?", qtype: "B" },
          { num: 21, q: "Tell me about a time you had to manage up — influencing your manager or VP.", qtype: "B" },
          { num: 22, q: "How do you build and maintain relationships with cross-functional stakeholders?", qtype: "B" },
        ],
      },
      {
        title: "🎭 Culture & Values",
        cards: [
          { num: 23, q: "What product management philosophy do you follow?", qtype: "C" },
          { num: 24, q: "How do you handle ambiguity and uncertainty in your work?", qtype: "C" },
          { num: 25, q: "What is the most important quality for a Product Manager?", qtype: "C" },
          { num: 26, q: "How do you keep yourself and your team motivated during long projects?", qtype: "C" },
          { num: 27, q: "What do you look for in a company culture?", qtype: "C" },
          { num: 28, q: "How do you balance data-driven decisions with intuition?", qtype: "C" },
          { num: 29, q: "Tell me about a time you failed. What did you learn?", qtype: "C" },
          { num: 30, q: "What is your approach to work-life balance in a fast-paced startup?", qtype: "C" },
        ],
      },
    ],
  },
  {
    id: "em-ceo-executive",
    company: "Tech Company",
    role: "Engineering Manager",
    roundType: "ceo",
    language: "en",
    description:
      "25 CEO/executive round questions for Engineering Manager roles covering strategy, leadership, and organizational thinking",
    questionCount: 25,
    moduleCount: 3,
    sources: ["Glassdoor", "Blind", "interviewing.io"],
    tags: ["Management", "Engineering", "Leadership", "Executive"],
    boardType: "technical",
    qtypes: { B: "Behavioral", T: "Technical", S: "Scenario", C: "Culture" },
    modules: [
      {
        title: "👔 Strategic Thinking & Vision",
        cards: [
          { num: 1, q: "How do you align engineering priorities with business objectives?", qtype: "T" },
          { num: 2, q: "Tell me about a time you had to make a build-vs-buy decision. What was your framework?", qtype: "B" },
          { num: 3, q: "How do you measure engineering team productivity without micromanaging?", qtype: "T" },
          { num: 4, q: "Describe your approach to technical roadmap planning. How far ahead do you plan?", qtype: "T" },
          { num: 5, q: "How do you handle technical debt at the organizational level?", qtype: "S" },
          { num: 6, q: "What is your philosophy on platform vs product engineering investments?", qtype: "T" },
          { num: 7, q: "How would you evaluate whether to adopt a new technology stack?", qtype: "S" },
          { num: 8, q: "Tell me about a strategic initiative you led that had significant business impact.", qtype: "B" },
          { num: 9, q: "How do you communicate engineering value to non-technical executives?", qtype: "B" },
        ],
      },
      {
        title: "🏗️ Team Building & Leadership",
        cards: [
          { num: 10, q: "How do you build a high-performing engineering team from scratch?", qtype: "B" },
          { num: 11, q: "Describe your hiring process. What do you look for in senior engineers?", qtype: "B" },
          { num: 12, q: "How do you handle underperforming team members?", qtype: "S" },
          { num: 13, q: "Tell me about a time you had to restructure your team. What drove the decision?", qtype: "B" },
          { num: 14, q: "How do you retain top engineering talent?", qtype: "B" },
          { num: 15, q: "Describe your approach to fostering innovation within your team.", qtype: "B" },
          { num: 16, q: "How do you handle conflict between team members?", qtype: "S" },
          { num: 17, q: "What is your approach to engineering career ladders and promotions?", qtype: "T" },
        ],
      },
      {
        title: "🎯 Executive Presence & Culture",
        cards: [
          { num: 18, q: "What attracted you to this company? What do you hope to accomplish here?", qtype: "C" },
          { num: 19, q: "How do you build trust with the executive team?", qtype: "B" },
          { num: 20, q: "Tell me about a time you had to push back on an executive decision.", qtype: "B" },
          { num: 21, q: "How do you think about diversity and inclusion in engineering hiring?", qtype: "C" },
          { num: 22, q: "What is the biggest challenge facing engineering organizations today?", qtype: "C" },
          { num: 23, q: "How do you balance moving fast with maintaining engineering quality?", qtype: "S" },
          { num: 24, q: "Where do you see the role of AI in software engineering in the next 5 years?", qtype: "C" },
          { num: 25, q: "What questions do you have for me about the company's direction?", qtype: "C" },
        ],
      },
    ],
  },
];

export function getTemplatesByCompany(company: string): BoardTemplate[] {
  return BOARD_TEMPLATES.filter((t) =>
    t.company.toLowerCase().includes(company.toLowerCase())
  );
}

export function getTemplatesByTag(tag: string): BoardTemplate[] {
  return BOARD_TEMPLATES.filter((t) =>
    t.tags.some((tt) => tt.toLowerCase().includes(tag.toLowerCase()))
  );
}

export function getFeaturedTemplates(): BoardTemplate[] {
  return BOARD_TEMPLATES.slice(0, 8);
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  BOARD_TEMPLATES.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}
