import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Character } from '../../components/Character';
import { Button, Card, H, Sub } from '../../components/ui';
import {
  CHARACTERS,
  DOMAINS,
  NO_FILTERS,
  PERIODS,
  groupByDayAndPeriod,
  toggleFilter,
  type CharacterId,
  type PeriodId,
  type TimelineEntry,
} from '../../domain';
import { useTheme } from '../../theme';
import { Checkin, EventRow, addEvent, listEvents, recentCheckins, toggleEventDone } from '../../db/repo';

/**
 * The timeline, read as Day → Morning / Afternoon / Night (T-022, ADR 0001).
 *
 * All of the grouping and filtering lives in `src/domain/grouping.ts`, which is
 * where it is tested. This file decides what that structure looks like, and
 * nothing more.
 *
 * The filters are a view, not a verdict. A period with nothing in it is not
 * drawn at all, rather than shown as an empty slot waiting to be filled, and
 * no copy here treats a quiet stretch as something that went wrong.
 */

type Item = TimelineEntry & {
  key: string;
  kind: 'event' | 'checkin';
  event?: EventRow;
  checkin?: Checkin;
};

const bodyColour = (id: CharacterId) => CHARACTERS.find((c) => c.id === id)!.body;

/**
 * A filter toggle. The label is always drawn, selected or not, so neither the
 * period nor the state of the filter is carried by colour alone.
 */
function FilterChip({
  label,
  accessibilityLabel,
  selected,
  colour,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  selected: boolean;
  colour: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: selected ? colour : 'transparent',
        borderWidth: 1,
        borderColor: colour,
      }}
    >
      <Text style={{ color: selected ? '#fff' : t.text, fontSize: 13 }}>
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  );
}

export function Timeline({ onChanged }: { onChanged: () => void }) {
  const t = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<string>(DOMAINS[0].id);

  const [periods, setPeriods] = useState<readonly PeriodId[]>(NO_FILTERS.periods);
  const [areas, setAreas] = useState<readonly string[]>(NO_FILTERS.domains);
  const [search, setSearch] = useState(NO_FILTERS.search);

  const load = useCallback(async () => {
    const [ev, ci] = await Promise.all([listEvents(), recentCheckins(100)]);
    const all: Item[] = [
      ...ev.map((e) => ({
        key: `e${e.id}`,
        when: e.starts_at,
        period: e.period,
        domain: e.domain,
        text: e.title,
        kind: 'event' as const,
        event: e,
      })),
      ...ci.map((c) => ({
        key: `c${c.id}`,
        // The timestamp stays authoritative (T-021); `day` is the fallback for
        // a row old enough not to carry one.
        when: c.created_at ?? c.day,
        period: c.period,
        // A check-in belongs to a day, not to a life area.
        domain: null,
        text: c.note,
        kind: 'checkin' as const,
        checkin: c,
      })),
    ];
    setItems(all);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // Ordering is the grouping's job now, so nothing is sorted on the way in.
  const days = useMemo(
    () => groupByDayAndPeriod(items, { periods, domains: areas, search }),
    [items, periods, areas, search],
  );

  const filtering = periods.length > 0 || areas.length > 0 || search.trim().length > 0;

  const clearFilters = () => {
    setPeriods(NO_FILTERS.periods);
    setAreas(NO_FILTERS.domains);
    setSearch(NO_FILTERS.search);
  };

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 12 }}
      keyboardShouldPersistTaps="handled"
    >
      <H>Timeline</H>
      <Sub>Your past and what is coming up, in one place.</Sub>
      <Card style={{ gap: 10 }}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Add something (a plan, a memory, a goal)"
          placeholderTextColor={t.sub}
          style={{
            color: t.text,
            fontSize: 16,
            borderBottomWidth: 1,
            borderColor: t.line,
            paddingVertical: 8,
          }}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DOMAINS.map((d) => (
            <Pressable
              key={d.id}
              onPress={() => setDomain(d.id)}
              accessibilityRole="button"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 14,
                backgroundColor: domain === d.id ? d.color : 'transparent',
                borderWidth: 1,
                borderColor: d.color,
              }}
            >
              <Text style={{ color: domain === d.id ? '#fff' : t.text, fontSize: 13 }}>{d.label}</Text>
            </Pressable>
          ))}
        </View>
        <Button
          label="Add to timeline"
          disabled={!title.trim()}
          onPress={async () => {
            await addEvent(title.trim(), domain, new Date());
            setTitle('');
            await load();
            onChanged();
          }}
        />
      </Card>

      <Card style={{ gap: 10 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search the timeline"
          placeholder="Search"
          placeholderTextColor={t.sub}
          style={{
            color: t.text,
            fontSize: 16,
            borderBottomWidth: 1,
            borderColor: t.line,
            paddingVertical: 8,
          }}
        />

        <Text style={{ color: t.sub, fontSize: 12 }}>Time of day</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PERIODS.map((p) => (
            <FilterChip
              key={p.id}
              label={p.label}
              accessibilityLabel={`Show ${p.label}`}
              selected={periods.includes(p.id)}
              colour={bodyColour(p.companion)}
              onPress={() => setPeriods((current) => toggleFilter(current, p.id))}
            />
          ))}
        </View>

        <Text style={{ color: t.sub, fontSize: 12 }}>Life areas</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DOMAINS.map((d) => (
            <FilterChip
              key={d.id}
              label={d.label}
              accessibilityLabel={`Show ${d.label}`}
              selected={areas.includes(d.id)}
              colour={d.color}
              onPress={() => setAreas((current) => toggleFilter(current, d.id))}
            />
          ))}
        </View>

        {filtering && (
          <Pressable
            onPress={clearFilters}
            accessibilityRole="button"
            accessibilityLabel="Clear filters"
            style={{ paddingVertical: 6 }}
          >
            <Text style={{ color: t.accent, fontSize: 14 }}>Clear filters</Text>
          </Pressable>
        )}
      </Card>

      {days.length === 0 && (
        <Card>
          <Text testID="timeline-empty" style={{ color: t.sub, fontSize: 15, lineHeight: 21 }}>
            {filtering
              ? 'Nothing in this view. The rest is still here — clear the filters to see it.'
              : 'Nothing here yet. Add something above whenever you feel like it.'}
          </Text>
        </Card>
      )}

      {days.map((day) => (
        <View key={day.day} style={{ gap: 10 }}>
          <Text
            accessibilityRole="header"
            accessibilityLabel={day.accessibilityLabel}
            style={{ color: t.text, fontSize: 18, fontWeight: '700', marginTop: 8 }}
          >
            {day.label}
          </Text>

          {day.periods.map((section) => (
            <View key={section.period} style={{ gap: 8 }}>
              <View
                accessibilityRole="header"
                accessibilityLabel={section.accessibilityLabel}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Character id={section.companion} color={bodyColour(section.companion)} size={28} />
                <Text style={{ color: t.sub, fontSize: 14, fontWeight: '600' }}>{section.label}</Text>
              </View>

              {section.entries.map((it) => {
                if (it.kind === 'checkin') {
                  const c = it.checkin!;
                  return (
                    <Card key={it.key}>
                      {/* The day heading above already says which day this is. */}
                      <Text style={{ color: t.sub, fontSize: 12 }}>check-in</Text>
                      <Text style={{ color: t.text, fontSize: 16 }}>Mood {c.mood}/5</Text>
                      {!!c.note && <Text style={{ color: t.sub, marginTop: 4 }}>{c.note}</Text>}
                    </Card>
                  );
                }
                const e = it.event!;
                const d = DOMAINS.find((x) => x.id === e.domain);
                return (
                  <Pressable
                    key={it.key}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: !!e.done }}
                    onPress={async () => {
                      await toggleEventDone(e.id, !e.done);
                      await load();
                      onChanged();
                    }}
                  >
                    <Card style={{ borderLeftWidth: 5, borderLeftColor: d?.color }}>
                      {/* Only the life area: the day heading carries the date,
                          and an entry whose area predates DOMAINS has none. */}
                      {!!d && <Text style={{ color: t.sub, fontSize: 12 }}>{d.label}</Text>}
                      <Text
                        style={{
                          color: t.text,
                          fontSize: 16,
                          textDecorationLine: e.done ? 'line-through' : 'none',
                        }}
                      >
                        {e.title}
                      </Text>
                      <Text style={{ color: t.sub, fontSize: 12 }}>{e.done ? 'Done' : 'Tap when done'}</Text>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
