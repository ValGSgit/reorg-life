import { orderTasks } from '../../../scripts/lib/task-order.mjs';

/**
 * Ordering has to be something the script decides, not something a human
 * overrides each session — a tool that gets overruled by hand stops being
 * trusted, and then nobody runs it.
 *
 * `enables_review_of` is the honest encoding of a real but non-compile-time
 * relationship: T-037 builds the harness that makes it possible to *review*
 * T-022 and T-023. It is not a blocker — those tasks can be built without it —
 * so it changes ordering only and never readiness.
 */
const task = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'T-001',
  priority: 'P1',
  milestone: 'W3-4',
  enablesReviewOf: [] as string[],
  ...over,
});

const ids = (list: ReturnType<typeof task>[]) => orderTasks(list).map((t: { id: string }) => t.id);

describe('orderTasks', () => {
  it('orders by priority, then milestone, then id', () => {
    expect(
      ids([
        task({ id: 'T-003', priority: 'P2', milestone: 'W3-4' }),
        task({ id: 'T-002', priority: 'P1', milestone: 'W5-6' }),
        task({ id: 'T-001', priority: 'P1', milestone: 'W3-4' }),
      ]),
    ).toEqual(['T-001', 'T-002', 'T-003']);
  });

  it('puts an enabler immediately before the task it unblocks review of', () => {
    expect(
      ids([
        task({ id: 'T-021', priority: 'P1', milestone: 'W3-4' }),
        task({ id: 'T-022', priority: 'P1', milestone: 'W3-4' }),
        task({ id: 'T-023', priority: 'P1', milestone: 'W3-4' }),
        task({ id: 'T-037', priority: 'P1', milestone: 'W3-4', enablesReviewOf: ['T-022', 'T-023'] }),
      ]),
    ).toEqual(['T-021', 'T-037', 'T-022', 'T-023']);
  });

  it('lifts an enabler out of a later milestone to sit before what it enables', () => {
    expect(
      ids([
        task({ id: 'T-050', priority: 'P2', milestone: 'W9-10', enablesReviewOf: ['T-022'] }),
        task({ id: 'T-022', priority: 'P1', milestone: 'W3-4' }),
      ]),
    ).toEqual(['T-050', 'T-022']);
  });

  it('ignores an enables_review_of pointing at a task that is not here', () => {
    // The enabled task may be done, cut, or simply filtered out of the ready
    // list. That must not move the enabler to the front of everything.
    expect(
      ids([
        task({ id: 'T-001', priority: 'P1', milestone: 'W3-4' }),
        task({ id: 'T-099', priority: 'P3', milestone: 'W9-10', enablesReviewOf: ['T-404'] }),
      ]),
    ).toEqual(['T-001', 'T-099']);
  });

  it('does not let a mutual pair loop forever', () => {
    // Nothing should declare this, but a typo must not hang the script.
    const out = ids([
      task({ id: 'T-010', priority: 'P1', milestone: 'W3-4', enablesReviewOf: ['T-011'] }),
      task({ id: 'T-011', priority: 'P1', milestone: 'W3-4', enablesReviewOf: ['T-010'] }),
    ]);
    expect(out).toHaveLength(2);
    expect(out).toContain('T-010');
    expect(out).toContain('T-011');
  });

  it('is a total order — the result does not depend on input order', () => {
    const a = [
      task({ id: 'T-021', priority: 'P1', milestone: 'W3-4' }),
      task({ id: 'T-037', priority: 'P1', milestone: 'W3-4', enablesReviewOf: ['T-022'] }),
      task({ id: 'T-022', priority: 'P1', milestone: 'W3-4' }),
    ];
    expect(ids(a)).toEqual(ids([...a].reverse()));
  });
});
