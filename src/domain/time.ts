/**
 * Local-time day key, `YYYY-MM-DD`.
 *
 * Deliberately built from the local calendar fields rather than
 * `toISOString()`, which would shift the day across UTC boundaries and give
 * the wrong answer for anyone east or west of UTC late in the evening.
 */
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
