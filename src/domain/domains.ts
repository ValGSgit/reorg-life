/**
 * The life areas an entry can belong to. Pure data; no React.
 *
 * A selected filter chip fills with this colour and puts white text on it, so
 * these are text colours, not just decoration. The original pastels ran from
 * 2.11 to 3.54 against white — every one of them failed AA. Darkened along
 * their own hue, lightness only, so the set still reads as a calm spread
 * rather than six loud blocks.
 */
export const DOMAINS = [
  { id: 'health', label: 'Health', color: '#447C51' },
  { id: 'relationships', label: 'Relationships', color: '#CB375D' },
  { id: 'work', label: 'Work', color: '#4A71AA' },
  { id: 'creativity', label: 'Creativity', color: '#9A641E' },
  { id: 'finances', label: 'Finances', color: '#7464B5' },
  { id: 'digital', label: 'Digital footprint', color: '#3A7A7A' },
] as const;

export type DomainId = (typeof DOMAINS)[number]['id'];
