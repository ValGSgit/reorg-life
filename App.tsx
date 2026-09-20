import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebNotice } from './src/components/WebNotice';
import { Onboarding } from './src/features/onboarding/Onboarding';
import { Home } from './src/features/home/Home';
import { CheckIn } from './src/features/checkin/CheckIn';
import { Habits } from './src/features/habits/Habits';
import { Timeline } from './src/features/timeline/Timeline';
import { Settings } from './src/features/settings/Settings';
import { getProfile } from './src/db/repo';
import { useTheme } from './src/theme';

const TABS = ['Home', 'Check-in', 'Habits', 'Timeline', 'Settings'] as const;

export default function App() {
  const t = useTheme();
  const [ready, setReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Home');
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  useEffect(() => { getProfile().then((p) => { setHasProfile(!!p); setReady(true); }); }, []);

  if (!ready) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: t.bg }}><ActivityIndicator /></View>;
  if (!hasProfile)
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <WebNotice />
        <View style={{ flex: 1 }}>
          <Onboarding onDone={() => setHasProfile(true)} />
        </View>
        <StatusBar style="auto" />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <WebNotice />
      <View style={{ flex: 1 }}>
        {tab === 'Home' && <Home refreshKey={refreshKey} />}
        {tab === 'Check-in' && <CheckIn onSaved={bump} />}
        {tab === 'Habits' && <Habits onChanged={bump} />}
        {tab === 'Timeline' && <Timeline onChanged={bump} />}
        {tab === 'Settings' && <Settings onChanged={bump} />}
      </View>
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: t.line, backgroundColor: t.card, paddingBottom: 16 }}>
        {TABS.map((n) => (
          <Pressable
            key={n}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === n }}
            onPress={() => setTab(n)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 2 }}>
            <Text
              numberOfLines={1}
              style={{ color: tab === n ? t.accent : t.sub, fontWeight: tab === n ? '700' : '500', fontSize: 13 }}>
              {n}
            </Text>
          </Pressable>
        ))}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}
