// Alias route to keep existing frontend fetch("/api/CardData") working in production
// Re-exports the handler from the canonical location under /api/content/CardData
export { default } from './content/CardData';


