import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Timeline } from '../../src/features/timeline/Timeline';
import { dayKey } from '../../src/domain';
import * as repo from '../../src/db/repo';

/**
 * The screen side of T-022: day headings, period sub-headings, and filters
 * that read as a view rather than a verdict.
 *
 * The repository is mocked because this asserts what the timeline *shows*;
 * the grouping itself is covered without a renderer in
 * `tests/unit/domain/grouping.test.ts`.
 *
 * Timestamps are built relative to the real clock so that "Today" and
 * "Yesterday" are the same headings whenever the suite happens to run.
 */

jest.mock('../../src/db/repo', () => ({
  listEvents: jest.fn(async () => []),
  recentCheckins: jest.fn(async () => []),
  addEvent: jest.fn(async () => undefined),
  toggleEventDone: jest.fn(async () => undefined),
}));

const mocked = repo as jest.Mocked<typeof repo>;

/** A local timestamp `daysAgo` days back, at `hour` o'clock. */
const at = (daysAgo: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${dayKey(d)}T${String(hour).padStart(2, '0')}:00:00`;
};

type Event = Awaited<ReturnType<typeof repo.listEvents>>[number];
type Checkin = Awaited<ReturnType<typeof repo.recentCheckins>>[number];

let nextId = 1;
const event = (fields: Partial<Event>): Event => ({
  id: nextId++,
  title: 'Something',
  domain: 'health',
  starts_at: at(0, 9),
  source: 'manual',
  done: 0,
  period: 'morning',
  ...fields,
});

const checkin = (fields: Partial<Checkin>): Checkin => ({
  id: nextId++,
  day: dayKey(),
  mood: 3,
  note: '',
  created_at: at(0, 9),
  period: 'morning',
  ...fields,
});

/**
 * Render, then let the load effect settle. Without that last step the effect's
 * promise is still in flight when a test presses something, and React reports
 * overlapping act() calls rather than the state change we are asserting on.
 */
const show = async (events: Event[], checkins: Checkin[] = []) => {
  mocked.listEvents.mockResolvedValue(events);
  mocked.recentCheckins.mockResolvedValue(checkins);
  const view = await render(<Timeline onChanged={() => {}} />);
  await act(async () => {});
  return view;
};

const press = async (label: string) => {
  const target = screen.getByLabelText(label);
  await act(async () => {
    fireEvent.press(target);
  });
};

const typeSearch = async (text: string) => {
  const box = screen.getByLabelText('Search the timeline');
  await act(async () => {
    fireEvent.changeText(box, text);
  });
};

beforeEach(() => {
  nextId = 1;
  jest.clearAllMocks();
});

describe('Timeline grouping', () => {
  it('puts a day heading above period sub-headings', async () => {
    await show([
      event({ title: 'Walk', starts_at: at(0, 9), period: 'morning' }),
      event({ title: 'Report', starts_at: at(0, 14), period: 'afternoon' }),
    ]);

    expect(await screen.findByText('Today')).toBeTruthy();
    expect(screen.getByLabelText('Morning, 1 entry')).toBeTruthy();
    expect(screen.getByLabelText('Afternoon, 1 entry')).toBeTruthy();
  });

  it('names each period section, so a period is never colour alone', async () => {
    await show([
      event({ title: 'Walk', starts_at: at(0, 9), period: 'morning' }),
      event({ title: 'Wind down', starts_at: at(0, 22), period: 'night' }),
    ]);

    await screen.findByText('Today');
    for (const label of ['Morning, 1 entry', 'Night, 1 entry']) {
      const section = screen.getByLabelText(label);
      expect(section.props.accessibilityRole).toBe('header');
    }
  });

  it('does not render a period nobody wrote in', async () => {
    await show([event({ title: 'Walk', starts_at: at(0, 9), period: 'morning' })]);

    await screen.findByText('Today');
    expect(screen.queryByLabelText('Afternoon, 0 entries')).toBeNull();
    expect(screen.queryByLabelText(/^Afternoon/)).toBeNull();
    expect(screen.queryByLabelText(/^Night/)).toBeNull();
  });

  it('separates two days under their own headings', async () => {
    await show([
      event({ title: 'Walk', starts_at: at(0, 9), period: 'morning' }),
      event({ title: 'Standup', starts_at: at(1, 9), period: 'morning' }),
    ]);

    expect(await screen.findByText('Today')).toBeTruthy();
    expect(screen.getByText('Yesterday')).toBeTruthy();
    expect(screen.getAllByLabelText('Morning, 1 entry')).toHaveLength(2);
  });

  it('still groups an entry written before the period migration', async () => {
    // period: null is what the backfill leaves behind when it cannot read a
    // timestamp; the timestamp on the row still says when it happened.
    await show([event({ title: 'Old note', starts_at: at(0, 9), period: null })]);

    expect(await screen.findByLabelText('Morning, 1 entry')).toBeTruthy();
    expect(screen.getByText('Old note')).toBeTruthy();
  });

  it('leaves the date to the day heading instead of repeating it on every card', async () => {
    await show(
      [event({ title: 'Walk', starts_at: at(0, 9), period: 'morning' })],
      [checkin({ created_at: at(0, 14), period: 'afternoon', note: 'Steadier' })],
    );

    await screen.findByText('Today');
    expect(screen.queryByText(new RegExp(dayKey()))).toBeNull();
    expect(screen.getByText('check-in')).toBeTruthy();
  });

  it('says nothing rather than trailing a separator when the life area is unknown', async () => {
    // Demo data carries life areas that are not in DOMAINS, and so did some
    // early real entries. A card for one should not render a stray divider.
    await show([event({ title: 'Odd one', starts_at: at(0, 9), period: 'morning', domain: 'home' })]);

    await screen.findByText('Odd one');
    expect(screen.queryByText(/·/)).toBeNull();
  });

  it('shows check-ins alongside events, under the period they happened in', async () => {
    await show([], [checkin({ created_at: at(0, 14), period: 'afternoon', note: 'Steadier today' })]);

    expect(await screen.findByLabelText('Afternoon, 1 entry')).toBeTruthy();
    expect(screen.getByText('Steadier today')).toBeTruthy();
  });
});

describe('Timeline filters', () => {
  const twoPeriods = () => [
    event({ title: 'Walk', starts_at: at(0, 9), period: 'morning', domain: 'health' }),
    event({ title: 'Report', starts_at: at(0, 14), period: 'afternoon', domain: 'work' }),
    event({ title: 'Stretch', starts_at: at(0, 22), period: 'night', domain: 'health' }),
  ];

  it('narrows to one period when that period is picked', async () => {
    await show(twoPeriods());
    await screen.findByText('Walk');

    await press('Show Morning');

    expect(screen.getByText('Walk')).toBeTruthy();
    expect(screen.queryByText('Report')).toBeNull();
    expect(screen.queryByText('Stretch')).toBeNull();
  });

  it('shows several periods at once', async () => {
    await show(twoPeriods());
    await screen.findByText('Walk');

    await press('Show Morning');
    await press('Show Night');

    expect(screen.getByText('Walk')).toBeTruthy();
    expect(screen.getByText('Stretch')).toBeTruthy();
    expect(screen.queryByText('Report')).toBeNull();
  });

  it('combines a period filter with a life-area filter', async () => {
    await show(twoPeriods());
    await screen.findByText('Walk');

    await press('Show Night');
    await press('Show Health');

    expect(screen.getByText('Stretch')).toBeTruthy();
    expect(screen.queryByText('Walk')).toBeNull();
    expect(screen.queryByText('Report')).toBeNull();
  });

  it('restores everything when the filters are cleared', async () => {
    await show(twoPeriods());
    await screen.findByText('Walk');

    await press('Show Morning');
    expect(screen.queryByText('Report')).toBeNull();

    await press('Clear filters');

    expect(screen.getByText('Walk')).toBeTruthy();
    expect(screen.getByText('Report')).toBeTruthy();
    expect(screen.getByText('Stretch')).toBeTruthy();
  });

  it('marks a chosen period as selected, and unmarks it when pressed again', async () => {
    await show(twoPeriods());
    await screen.findByText('Walk');

    expect(screen.getByLabelText('Show Morning').props.accessibilityState.selected).toBe(false);

    await press('Show Morning');
    expect(screen.getByLabelText('Show Morning').props.accessibilityState.selected).toBe(true);

    await press('Show Morning');
    expect(screen.getByLabelText('Show Morning').props.accessibilityState.selected).toBe(false);
    expect(screen.getByText('Report')).toBeTruthy();
  });

  it('searches within the active filters rather than across everything', async () => {
    await show([
      event({ title: 'Walk the long way', starts_at: at(0, 9), period: 'morning' }),
      event({ title: 'Walk after dinner', starts_at: at(0, 22), period: 'night' }),
    ]);
    await screen.findByText('Walk the long way');

    await typeSearch('walk');
    expect(screen.getByText('Walk the long way')).toBeTruthy();
    expect(screen.getByText('Walk after dinner')).toBeTruthy();

    await press('Show Night');
    expect(screen.queryByText('Walk the long way')).toBeNull();
    expect(screen.getByText('Walk after dinner')).toBeTruthy();
  });

  it('offers no way to clear filters when none are set', async () => {
    await show(twoPeriods());
    await screen.findByText('Walk');

    expect(screen.queryByLabelText('Clear filters')).toBeNull();
  });
});

describe('Timeline tone', () => {
  it('says a filtered view is empty without implying anything was missed', async () => {
    await show([event({ title: 'Walk', starts_at: at(0, 9), period: 'morning' })]);
    await screen.findByText('Walk');

    await press('Show Night');

    const empty = screen.getByTestId('timeline-empty');
    expect(empty.props.children).toMatch(/still here/i);
    expect(empty.props.children).not.toMatch(/miss|fail|gap|behind|should|streak/i);
  });

  it('greets an empty timeline without asking anything of the reader', async () => {
    await show([]);

    const empty = await screen.findByTestId('timeline-empty');
    expect(empty.props.children).not.toMatch(/miss|fail|gap|behind|should|streak/i);
  });
});
