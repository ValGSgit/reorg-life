/**
 * The order tasks should be done in.
 *
 * Ordering is priority, then milestone, then id — deterministic, so two people
 * asking get the same answer. The one addition is `enables_review_of`.
 *
 * Some tasks are not a prerequisite for *building* another task, but are a
 * prerequisite for *reviewing* it: the web preview harness (T-037) is what
 * makes it possible to look at a timeline grouped by period (T-022) or a
 * cross-fade (T-023) and say whether they are right. Encoding that as
 * `blocked_by` would be a lie — those tasks compile fine without it — and
 * leaving it out meant overriding the script by hand every session, which is
 * how a tool stops being trusted.
 *
 * So an enabler borrows the sort position of the earliest thing it enables and
 * sits immediately in front of it. It changes ordering only: readiness is
 * decided elsewhere and is untouched, so this can never deadlock the way a
 * real dependency can.
 *
 * Deliberately dependency-free and pure, like the rest of `scripts/lib`.
 */

export const MILESTONE_ORDER = ['W3-4', 'W5-6', 'W7-8', 'W9-10', 'W11', 'W12', 'Unscheduled'];
export const PRIORITY_ORDER = ['P1', 'P2', 'P3'];

const rank = (list, value) => {
  const index = list.indexOf(value);
  return index === -1 ? list.length : index;
};

/** Where a task sorts on its own merits, ignoring what it enables. */
const baseKey = (task) => [
  rank(PRIORITY_ORDER, task.priority),
  rank(MILESTONE_ORDER, task.milestone),
  task.id,
];

/**
 * Where a task actually sorts.
 *
 * An enabler takes the base key of the earliest task it enables, plus a tier
 * of 0 so it lands just in front of that task rather than just behind it.
 * Enabled tasks are looked up by their **base** key only — never recursively —
 * so a mutual or circular declaration is a harmless typo rather than a hang.
 */
const effectiveKey = (task, byId) => {
  const enabled = (task.enablesReviewOf ?? [])
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map(baseKey)
    .sort(compareKeys);

  const anchor = enabled.length ? enabled[0] : baseKey(task);
  // Final element breaks ties between two enablers of the same task.
  return [...anchor, enabled.length ? 0 : 1, task.id];
};

function compareKeys(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const x = a[i];
    const y = b[i];
    if (x === y) continue;
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    return x < y ? -1 : 1;
  }
  return 0;
}

/** Sorts tasks into the order they should be worked in. */
export function orderTasks(tasks) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  return [...tasks]
    .map((task) => ({ task, key: effectiveKey(task, byId) }))
    .sort((a, b) => compareKeys(a.key, b.key))
    .map((entry) => entry.task);
}
