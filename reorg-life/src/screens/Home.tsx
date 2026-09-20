import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Character } from '../components/Character';
import { Card, H, Sub } from '../components/ui';
import { CHARACTERS, DOMAINS, gentleStreak, levelFor, xpForLevel } from '../domain';
import { useTheme } from '../theme';
import { Profile, checkinDays, domainActivity, getProfile, recentCheckins } from '../db/repo';

export function Home({ refreshKey }: { refreshKey: number }) {
  const t = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streak, setStreak] = useState(0);
  const [mood, setMood] = useState(3);
  const [activity, setActivity] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setProfile(await getProfile());
    setStreak(gentleStreak(await checkinDays()));
    const r = await recentCheckins(3);
    if (r.length) setMood(Math.round(r.reduce((a, c) => a + c.mood, 0) / r.length));
    setActivity(await domainActivity());
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  if (!profile) return null;
  const ch = CHARACTERS.find((c) => c.id === profile.character_id) ?? CHARACTERS[0];
  const level = levelFor(profile.xp);
  const lo = xpForLevel(level), hi = xpForLevel(level + 1);
  const pct = Math.min(1, (profile.xp - lo) / (hi - lo));

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 16 }}>
      <H>Hi, {profile.display_name}</H>
      <Sub>{streak > 0 ? `${streak} day${streak === 1 ? '' : 's'} of showing up. Rest days are built in.` : 'Whenever you are ready, a check-in is a good place to start.'}</Sub>
      <Card style={{ alignItems: 'center', gap: 8 }}>
        <Character color={ch.body} mood={mood} size={160} />
        <Text style={{ color: t.text, fontWeight: '700' }}>{ch.name} · Level {level}</Text>
        <View style={{ height: 8, alignSelf: 'stretch', backgroundColor: t.line, borderRadius: 4 }}>
          <View style={{ width: `${pct * 100}%`, height: 8, backgroundColor: t.good, borderRadius: 4 }} />
        </View>
        <Text style={{ color: t.sub, fontSize: 13 }}>{profile.xp} XP</Text>
      </Card>
      <Card style={{ gap: 12 }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Life garden (last 2 weeks)</Text>
        {DOMAINS.map((d) => {
          const n = activity[d.id] ?? 0;
          return (
            <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: d.color }} />
              <Text style={{ color: t.text, width: 120 }}>{d.label}</Text>
              <View style={{ flex: 1, height: 8, backgroundColor: t.line, borderRadius: 4 }}>
                <View style={{ width: `${Math.min(1, n / 5) * 100}%`, height: 8, backgroundColor: d.color, borderRadius: 4 }} />
              </View>
            </View>
          );
        })}
        <Sub>Quiet areas are not failures, just places you have not visited lately.</Sub>
      </Card>
    </ScrollView>
  );
}
