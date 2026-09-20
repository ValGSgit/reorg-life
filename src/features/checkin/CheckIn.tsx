import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, Pressable, View } from 'react-native';
import { Button, H, Sub } from '../../components/ui';
import { MOODS, XP_PER_CHECKIN } from '../../domain';
import { useTheme } from '../../theme';
import { getTodayCheckin, saveCheckin } from '../../db/repo';

export function CheckIn({ onSaved }: { onSaved: () => void }) {
  const t = useTheme();
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getTodayCheckin().then((c) => {
      if (c) {
        setMood(c.mood);
        setNote(c.note);
      }
    });
  }, []);

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <H>How is today?</H>
      <Sub>There are no wrong answers. This is just for you.</Sub>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {MOODS.map((m) => (
          <Pressable
            key={m.value}
            accessibilityRole="button"
            onPress={() => setMood(m.value)}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: mood === m.value ? t.accent : t.line,
              backgroundColor: t.card,
            }}
          >
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 18 }}>{m.value}</Text>
            <Text style={{ color: t.sub, fontSize: 11 }}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="Anything on your mind? (optional)"
        placeholderTextColor={t.sub}
        style={{
          minHeight: 140,
          textAlignVertical: 'top',
          color: t.text,
          borderWidth: 1,
          borderColor: t.line,
          backgroundColor: t.card,
          borderRadius: 14,
          padding: 14,
          fontSize: 16,
        }}
      />
      <Button
        label="Save check-in"
        disabled={mood === null}
        onPress={async () => {
          const r = await saveCheckin(mood!, note.trim());
          setMsg(r.firstToday ? `Saved. +${XP_PER_CHECKIN} XP. Thanks for showing up.` : 'Updated.');
          onSaved();
        }}
      />
      {!!msg && <Sub>{msg}</Sub>}
    </ScrollView>
  );
}
