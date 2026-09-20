/** The life areas an entry can belong to. Pure data; no React. */
export const DOMAINS = [
  { id: 'health', label: 'Health', color: '#7DB88B' },
  { id: 'relationships', label: 'Relationships', color: '#E28FA4' },
  { id: 'work', label: 'Work', color: '#6C8EBF' },
  { id: 'creativity', label: 'Creativity', color: '#E0A85F' },
  { id: 'finances', label: 'Finances', color: '#8C7FC2' },
  { id: 'digital', label: 'Digital footprint', color: '#5FB3B3' },
] as const;

export type DomainId = (typeof DOMAINS)[number]['id'];
