import React, { useState } from 'react';
import { ScrollView, Text, TextInput, View, Pressable } from 'react-native';
import { Character } from '../../components/Character';
import { Button, H, Sub } from '../../components/ui';
import { CHARACTERS, CharacterId } from '../../domain';
import { useTheme } from '../../theme';
import { createProfile } from '../../db/repo';
import { scheduleDailyCheckin } from '../../reminders';

export function Onboarding({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const [sel, setSel] = useState<CharacterId>('sprout');
  const [name, setName] = useState('');
  const c = CHARACTERS.find((x) => x.id === sel)!;

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 72, gap: 20 }} style={{ backgroundColor: t.bg }}>
      <View>
        <H>Welcome</H>
        <Sub>Choose a companion. It grows as you look after the parts of your life that matter to you. Everything stays on this phone.</Sub>
      </View>
      <View style={{ alignItems: 'center', paddingVertical: 12 }}>
        <Character id={c.id} color={c.body} mood={4} size={170} />
        <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', marginTop: 8 }}>{c.name}</Text>
        <Text style={{ color: t.sub }}>{c.trait}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {CHARACTERS.map((x) => (
          <Pressable key={x.id} accessibilityRole="button" accessibilityLabel={`Choose ${x.name}`} onPress={() => setSel(x.id)}
            style={{ borderWidth: 2, borderColor: sel === x.id ? t.accent : t.line, borderRadius: 18, padding: 6, backgroundColor: t.card }}>
            <Character id={x.id} color={x.body} size={64} />
          </Pressable>
        ))}
      </View>
      <TextInput value={name} onChangeText={setName} placeholder="What should we call you?" placeholderTextColor={t.sub}
        style={{ color: t.text, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, borderRadius: 14, padding: 14, fontSize: 16 }} />
      <Button label="Begin" disabled={!name.trim()} onPress={async () => {
        await createProfile(sel, name.trim());
        await scheduleDailyCheckin().catch(() => false);
        onDone();
      }} />
    </ScrollView>
  );
}
