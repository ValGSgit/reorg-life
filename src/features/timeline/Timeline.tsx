import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button, Card, H, Sub } from '../../components/ui';
import { DOMAINS } from '../../domain';
import { useTheme } from '../../theme';
import { Checkin, EventRow, addEvent, listEvents, recentCheckins, toggleEventDone } from '../../db/repo';

type Item = { key: string; when: string; kind: 'event' | 'checkin'; event?: EventRow; checkin?: Checkin };

export function Timeline({ onChanged }: { onChanged: () => void }) {
  const t = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<string>(DOMAINS[0].id);

  const load = useCallback(async () => {
    const [ev, ci] = await Promise.all([listEvents(), recentCheckins(100)]);
    const all: Item[] = [
      ...ev.map((e) => ({ key: `e${e.id}`, when: e.starts_at, kind: 'event' as const, event: e })),
      ...ci.map((c) => ({ key: `c${c.id}`, when: c.day, kind: 'checkin' as const, checkin: c })),
    ].sort((a, b) => b.when.localeCompare(a.when));
    setItems(all);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 12 }} keyboardShouldPersistTaps="handled">
      <H>Timeline</H>
      <Sub>Your past and what is coming up, in one place.</Sub>
      <Card style={{ gap: 10 }}>
        <TextInput value={title} onChangeText={setTitle} placeholder="Add something (a plan, a memory, a goal)" placeholderTextColor={t.sub}
          style={{ color: t.text, fontSize: 16, borderBottomWidth: 1, borderColor: t.line, paddingVertical: 8 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DOMAINS.map((d) => (
            <Pressable key={d.id} onPress={() => setDomain(d.id)} accessibilityRole="button"
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: domain === d.id ? d.color : 'transparent', borderWidth: 1, borderColor: d.color }}>
              <Text style={{ color: domain === d.id ? '#fff' : t.text, fontSize: 13 }}>{d.label}</Text>
            </Pressable>
          ))}
        </View>
        <Button label="Add to timeline" disabled={!title.trim()} onPress={async () => {
          await addEvent(title.trim(), domain, new Date());
          setTitle(''); await load(); onChanged();
        }} />
      </Card>
      {items.map((it) => {
        if (it.kind === 'checkin') {
          const c = it.checkin!;
          return (
            <Card key={it.key}>
              <Text style={{ color: t.sub, fontSize: 12 }}>{c.day} · check-in</Text>
              <Text style={{ color: t.text, fontSize: 16 }}>Mood {c.mood}/5</Text>
              {!!c.note && <Text style={{ color: t.sub, marginTop: 4 }}>{c.note}</Text>}
            </Card>
          );
        }
        const e = it.event!;
        const d = DOMAINS.find((x) => x.id === e.domain);
        return (
          <Pressable key={it.key} accessibilityRole="checkbox" accessibilityState={{ checked: !!e.done }}
            onPress={async () => { await toggleEventDone(e.id, !e.done); await load(); onChanged(); }}>
            <Card style={{ borderLeftWidth: 5, borderLeftColor: d?.color }}>
              <Text style={{ color: t.sub, fontSize: 12 }}>{e.starts_at.slice(0, 10)} · {d?.label}</Text>
              <Text style={{ color: t.text, fontSize: 16, textDecorationLine: e.done ? 'line-through' : 'none' }}>{e.title}</Text>
              <Text style={{ color: t.sub, fontSize: 12 }}>{e.done ? 'Done' : 'Tap when done'}</Text>
            </Card>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
