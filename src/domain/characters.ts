/**
 * The companions. `body` is the blob colour used until artwork exists;
 * generated art is registered separately in `src/characterArt.ts`, keyed by
 * these ids.
 */
export const CHARACTERS = [
  { id: 'sprout', name: 'Sprout', trait: 'Calm', body: '#A8D5BA' },
  { id: 'comet', name: 'Comet', trait: 'Curious', body: '#9DB8F0' },
  { id: 'ember', name: 'Ember', trait: 'Energetic', body: '#F4A97F' },
  { id: 'moss', name: 'Moss', trait: 'Cozy', body: '#C9B79C' },
  { id: 'blaze', name: 'Blaze', trait: 'Bold', body: '#E88C8C' },
  { id: 'dusk', name: 'Dusk', trait: 'Dreamy', body: '#C4A8E0' },
] as const;

export type CharacterId = (typeof CHARACTERS)[number]['id'];

/** The five-point mood scale used by check-ins. Never labelled good or bad. */
export const MOODS = [
  { value: 1, label: 'Rough' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
] as const;
