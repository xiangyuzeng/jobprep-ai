// Module-level singleton map for abort controllers.
// Shared between /api/coach/chat and /api/coach/abort routes.
// Works because Vercel keeps module scope alive for warm invocations.
const abortControllers = new Map<string, AbortController>();
export { abortControllers };
