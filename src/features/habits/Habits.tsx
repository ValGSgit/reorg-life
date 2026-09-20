import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button, Card, H, Sub } from '../../components/ui';
import { DOMAINS, SCHEDULES, XP_PER_HABIT, scheduleLabel } from '../../domain';
import { useTheme } from '../../theme';
import { HabitView, createHabit, deleteHabit, habitViews, listHabits, setHabitDone, updateHabit } from '../../db/repo';
import { REMINDERS_SUPPORTED, parseTime, syncHabitReminders } from '../../reminders';

export function Habits({ onChanged }: { onChanged: () => void }) {
  const t = useTheme();
  const [habits, setHabits] = useState<HabitView[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<string>(DOMAINS[0].id);
  const [schedule, setSchedule] = useState<string>('daily');
  const [remindAt, setRemindAt] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => setHabits(await habitViews()), []);
  useEffect(() => { load(); }, [load]);

  // Reminders are rebuilt from the habit rows, so the two never drift apart.
  const resync = useCallback(async () => {
    if (!REMINDERS_SUPPORTED) return;
    const ok = await syncHabitReminders(await listHabits(true));
    if (!ok) setMsg('Reminders are off. You can turn notifications on in Settings whenever you like.');
  }, []);

  const timeInvalid = remindAt.trim() !== '' && !parseTime(remindAt);

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 12 }} keyboardShouldPersistTaps="handled">
      <H>Habits</H>
      <Sub>Small, repeating things. A missed day is forgiven automatically — a streak only stops after two.</Sub>

      {habits.map((h) => {
        const d = DOMAINS.find((x) => x.id === h.domain);
        return (
          <Card key={h.id} style={{ borderLeftWidth: 5, borderLeftColor: d?.color, gap: 8 }}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: h.doneToday }}
              accessibilityLabel={h.title}
              onPress={async () => {
                await setHabitDone(h.id, !h.doneToday);
                await load();
                onChanged();
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  borderWidth: 2,
                  borderColor: h.doneToday ? t.good : t.line,
                  backgroundColor: h.doneToday ? t.good : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {h.doneToday && <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{h.title}</Text>
                <Text style={{ color: t.sub, fontSize: 12 }}>
                  {scheduleLabel(h.schedule)}
                  {h.remind_at ? ` · ${h.remind_at}` : ''}
                  {h.dueToday ? '' : ' · not asked for today'}
                </Text>
              </View>
              <Text style={{ color: h.streak > 0 ? t.good : t.sub, fontSize: 13, fontWeight: '600' }}>
                {h.streak > 0 ? `${h.streak}d` : '—'}
              </Text>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  await updateHabit(h.id, { archived: 1 });
                  await load();
                  await resync();
                  onChanged();
                }}>
                <Text style={{ color: t.sub, fontSize: 12 }}>Put aside</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  await deleteHabit(h.id);
                  await load();
                  await resync();
                  onChanged();
                }}>
                <Text style={{ color: t.sub, fontSize: 12 }}>Delete</Text>
              </Pressable>
            </View>
          </Card>
        );
      })}

      {habits.length === 0 && !adding && (
        <Card>
          <Sub>Nothing here yet. One small habit is plenty to begin with.</Sub>
        </Card>
      )}

      {!adding && <Button label="Add a habit" kind="ghost" onPress={() => setAdding(true)} />}

      {adding && (
        <Card style={{ gap: 12 }}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What would you like to return to?"
            placeholderTextColor={t.sub}
            style={{ color: t.text, fontSize: 16, borderBottomWidth: 1, borderColor: t.line, paddingVertical: 8 }}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DOMAINS.map((d) => (
              <Pressable
                key={d.id}
                accessibilityRole="button"
                onPress={() => setDomain(d.id)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: domain === d.id ? d.color : 'transparent', borderWidth: 1, borderColor: d.color }}>
                <Text style={{ color: domain === d.id ? '#fff' : t.text, fontSize: 13 }}>{d.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SCHEDULES.map((s) => (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                onPress={() => setSchedule(s.id)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: schedule === s.id ? t.accent : t.line, backgroundColor: schedule === s.id ? t.accent : 'transparent' }}>
                <Text style={{ color: schedule === s.id ? '#fff' : t.text, fontSize: 13 }}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ gap: 4 }}>
            <TextInput
              value={remindAt}
              onChangeText={setRemindAt}
              placeholder="Remind me at (HH:MM, optional)"
              placeholderTextColor={t.sub}
              autoCapitalize="none"
              style={{ color: t.text, fontSize: 16, borderBottomWidth: 1, borderColor: timeInvalid ? '#C2785F' : t.line, paddingVertical: 8 }}
            />
            {timeInvalid && <Text style={{ color: '#C2785F', fontSize: 12 }}>Use a 24-hour time like 08:30.</Text>}
            {!REMINDERS_SUPPORTED && <Text style={{ color: t.sub, fontSize: 12 }}>Reminders do not run in the web preview.</Text>}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Keep it"
                disabled={!title.trim() || timeInvalid}
                onPress={async () => {
                  await createHabit(title.trim(), domain, schedule, parseTime(remindAt) ? remindAt.trim() : null);
                  setTitle('');
                  setRemindAt('');
                  setSchedule('daily');
                  setAdding(false);
                  setMsg('');
                  await load();
                  await resync();
                  onChanged();
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Cancel"
                kind="ghost"
                onPress={() => {
                  setAdding(false);
                  setTitle('');
                  setRemindAt('');
                }}
              />
            </View>
          </View>
        </Card>
      )}

      {!!msg && <Sub>{msg}</Sub>}
      <Sub>Each habit you tick is +{XP_PER_HABIT} XP. Ticking is optional; the day still counts as yours.</Sub>
    </ScrollView>
  );
}
