import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Onboarding } from './src/screens/Onboarding';
import { Home } from './src/screens/Home';
import { CheckIn } from './src/screens/CheckIn';
import { Timeline } from './src/screens/Timeline';
import { getProfile } from './src/db/repo';
import { useTheme } from './src/theme';

const TABS = ['Home', 'Check-in', 'Timeline'] as const;

export default function App() {
  const t = useTheme();
  const [ready, setReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Home');
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  useEffect(() => { getProfile().then((p) => { setHasProfile(!!p); setReady(true); }); }, []);

  if (!ready) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: t.bg }}><ActivityIndicator /></View>;
  if (!hasProfile) return <><Onboarding onDone={() => setHasProfile(true)} /><StatusBar style="auto" /></>;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1 }}>
        {tab === 'Home' && <Home refreshKey={refreshKey} />}
        {tab === 'Check-in' && <CheckIn onSaved={bump} />}
        {tab === 'Timeline' && <Timeline onChanged={bump} />}
      </View>
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: t.line, backgroundColor: t.card, paddingBottom: 16 }}>
        {TABS.map((n) => (
          <Pressable key={n} accessibilityRole="tab" onPress={() => setTab(n)} style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
            <Text style={{ color: tab === n ? t.accent : t.sub, fontWeight: tab === n ? '700' : '500' }}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}
