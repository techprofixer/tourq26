/**
 * Hand-verified, stable reference pages the whole-page writer may cite as outbound links. A model
 * invents URLs, so it never picks its own: the server matches the page's topic against this list
 * and hands over only these, and `sanitizeLinks` strips anything else. Add entries only after
 * opening the URL — prefer official docs, standards bodies and government pages.
 */
export type AuthoritySource = { url: string; label: string; keywords: string[] };

export const AUTHORITY_SOURCES: AuthoritySource[] = [
  { url: "https://developer.mozilla.org/en-US/docs/Learn_web_development", label: "MDN Web Docs: learn web development", keywords: ["web development", "website", "frontend", "front-end", "javascript", "html", "css", "react", "next.js", "nextjs"] },
  { url: "https://web.dev/articles/vitals", label: "Google web.dev: Core Web Vitals", keywords: ["performance", "page speed", "core web vitals", "website", "web app", "seo"] },
  { url: "https://www.w3.org/WAI/standards-guidelines/wcag/", label: "W3C: Web Content Accessibility Guidelines (WCAG)", keywords: ["accessibility", "wcag", "ada", "inclusive"] },
  { url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide", label: "Google Search Central: SEO starter guide", keywords: ["seo", "search engine", "organic", "ranking", "keyword"] },
  { url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data", label: "Google Search Central: structured data", keywords: ["structured data", "schema", "json-ld", "rich results"] },
  { url: "https://owasp.org/www-project-top-ten/", label: "OWASP Top 10 web application security risks", keywords: ["security", "secure", "vulnerab", "penetration", "web application", "api", "authentication"] },
  { url: "https://csrc.nist.gov/projects/ssdf", label: "NIST Secure Software Development Framework", keywords: ["secure development", "software development", "sdlc", "compliance", "devsecops", "custom software"] },
  { url: "https://www.nist.gov/itl/ai-risk-management-framework", label: "NIST AI Risk Management Framework", keywords: ["ai", "artificial intelligence", "machine learning", "llm", "chatbot", "generative", "automation"] },
  { url: "https://www.nist.gov/privacy-framework", label: "NIST Privacy Framework", keywords: ["privacy", "data protection", "gdpr", "personal data", "crm", "customer data"] },
  { url: "https://developer.apple.com/design/human-interface-guidelines/", label: "Apple Human Interface Guidelines", keywords: ["mobile app", "ios", "iphone", "ipad", "swift", "app store"] },
  { url: "https://developer.android.com/guide", label: "Android Developers: app guide", keywords: ["mobile app", "android", "kotlin", "play store"] },
  { url: "https://reactnative.dev/docs/getting-started", label: "React Native documentation", keywords: ["react native", "cross-platform", "mobile app", "mobile development"] },
  { url: "https://www.openapis.org/", label: "OpenAPI Initiative", keywords: ["api", "rest", "integration", "backend", "microservice", "web services"] },
  { url: "https://aws.amazon.com/architecture/well-architected/", label: "AWS Well-Architected Framework", keywords: ["cloud", "aws", "architecture", "scalab", "infrastructure", "devops", "hosting", "migration"] },
  { url: "https://12factor.net/", label: "The Twelve-Factor App", keywords: ["saas", "cloud", "devops", "deployment", "architecture", "scalab"] },
  { url: "https://scrumguides.org/scrum-guide.html", label: "The Scrum Guide", keywords: ["agile", "scrum", "sprint", "project management", "delivery process", "dedicated team", "outsourc"] },
  { url: "https://www.cisa.gov/topics/cybersecurity-best-practices", label: "CISA: cybersecurity best practices", keywords: ["remote it", "managed it", "it support", "cybersecurity", "network", "remote work", "helpdesk", "it services"] },
  { url: "https://www.atlassian.com/devops", label: "Atlassian: what is DevOps", keywords: ["devops", "ci/cd", "continuous", "deployment", "pipeline"] },
];

const MAX_SOURCES = 2;

function hits(haystack: string, keyword: string): boolean {
  // Short keywords ("ai", "api") must match whole words; longer ones may match stems ("scalab").
  const k = keyword.toLowerCase();
  if (k.length <= 4) return new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(haystack);
  return haystack.includes(k);
}

/** The best-matching reference pages for a page's topic (title, keywords, path, copy). Possibly none. */
export function pickAuthoritySources(topic: string, max = MAX_SOURCES): AuthoritySource[] {
  const haystack = topic.toLowerCase();
  return AUTHORITY_SOURCES.map((s) => ({ s, score: s.keywords.filter((k) => hits(haystack, k)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.s);
}
