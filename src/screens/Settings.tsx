import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Character } from '../components/Character';
import { Button, Card, H, Sub } from '../components/ui';
import { CHARACTERS, CharacterId, levelFor } from '../domain';
import { useTheme } from '../theme';
import { EQUIPPED_SETTING, UNLOCKABLES, equippedItem } from '../unlockables';
import {
  Profile,
  getProfile,
  getSetting,
  listHabits,
  setCharacter,
  setSetting,
} from '../db/repo';
import {
  REMINDERS_SUPPORTED,
  cancelDailyCheckin,
  formatTime,
  getPermission,
  parseTime,
  scheduleDailyCheckin,
  syncHabitReminders,
  type PermissionState,
} from '../reminders';
import { BackupError, createBackup, describeSnapshot, restoreBackup } from '../backup';
import { loadBackup, saveBackup } from '../backupFile';
import { DB_IS_ENCRYPTED } from '../db';

const REMINDER_SETTING = 'checkin_reminder';
const DEFAULT_REMINDER = '20:00';

export function Settings({ onChanged }: { onChanged: () => void }) {
  const t = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reminder, setReminder] = useState(DEFAULT_REMINDER);
  const [remindersOn, setRemindersOn] = useState(false);
  const [permission, setPermission] = useState<PermissionState>('unsupported');
  const [equipped, setEquipped] = useState('none');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  // Shown once after an export; never written to disk.
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [importKey, setImportKey] = useState('');

  const load = useCallback(async () => {
    const p = await getProfile();
    setProfile(p);
    const stored = await getSetting(REMINDER_SETTING);
    setReminder(stored ?? DEFAULT_REMINDER);
    setRemindersOn(stored !== null && stored !== 'off');
    setEquipped((await getSetting(EQUIPPED_SETTING)) ?? 'none');
    setPermission(await getPermission());
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!profile) return null;
  const level = levelFor(profile.xp);
  const current = CHARACTERS.find((c) => c.id === profile.character_id) ?? CHARACTERS[0];
  const timeInvalid = !parseTime(reminder);

  const say = (m: string) => setNote(m);

  async function applyReminder(on: boolean, at: string) {
    if (!REMINDERS_SUPPORTED) {
      say('Reminders do not run in the web preview. Your choice is saved for the phone app.');
      await setSetting(REMINDER_SETTING, on ? at : 'off');
      return;
    }
    if (!on) {
      await cancelDailyCheckin();
      await setSetting(REMINDER_SETTING, 'off');
      setRemindersOn(false);
      say('Daily reminder off. Nothing else changes.');
      return;
    }
    const parsed = parseTime(at);
    if (!parsed) return;
    const ok = await scheduleDailyCheckin(parsed.hour, parsed.minute);
    setPermission(await getPermission());
    if (!ok) {
      say('Android has notifications turned off for ReorgLife. You can allow them in system settings, or leave them off — the app works either way.');
      return;
    }
    await setSetting(REMINDER_SETTING, formatTime(parsed.hour, parsed.minute));
    setRemindersOn(true);
    say(`Daily reminder set for ${formatTime(parsed.hour, parsed.minute)}.`);
  }

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 16 }} keyboardShouldPersistTaps="handled">
      <H>Settings</H>

      <Card style={{ gap: 10 }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Daily check-in reminder</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TextInput
            value={reminder}
            onChangeText={setReminder}
            placeholder="20:00"
            placeholderTextColor={t.sub}
            autoCapitalize="none"
            style={{ color: t.text, fontSize: 18, borderBottomWidth: 1, borderColor: timeInvalid ? '#C2785F' : t.line, paddingVertical: 6, width: 90, textAlign: 'center' }}
          />
          <View style={{ flex: 1 }}>
            <Button label={remindersOn ? 'Update' : 'Turn on'} disabled={timeInvalid} onPress={() => applyReminder(true, reminder)} />
          </View>
        </View>
        {timeInvalid && <Text style={{ color: '#C2785F', fontSize: 12 }}>Use a 24-hour time like 20:00.</Text>}
        {remindersOn && <Button label="Turn reminders off" kind="ghost" onPress={() => applyReminder(false, reminder)} />}
        {!REMINDERS_SUPPORTED && <Sub>Notifications are not part of the web preview.</Sub>}
        {REMINDERS_SUPPORTED && permission === 'denied' && (
          <Sub>Notifications are currently blocked for ReorgLife in your system settings.</Sub>
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Your companion</Text>
        <View style={{ alignItems: 'center' }}>
          <Character id={current.id} color={current.body} mood={4} size={120} item={equippedItem(equipped, level)} />
          <Text style={{ color: t.sub, marginTop: 6 }}>{current.name} · Level {level}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {CHARACTERS.map((x) => (
            <Pressable
              key={x.id}
              accessibilityRole="button"
              accessibilityLabel={`Change to ${x.name}`}
              onPress={async () => {
                await setCharacter(x.id as CharacterId);
                await load();
                onChanged();
                say(`${x.name} it is. Your progress carries over.`);
              }}
              style={{ borderWidth: 2, borderColor: current.id === x.id ? t.accent : t.line, borderRadius: 18, padding: 6, backgroundColor: t.card }}>
              <Character id={x.id} color={x.body} size={56} />
            </Pressable>
          ))}
        </View>
        <Sub>Changing companion keeps every check-in, habit and XP you have.</Sub>
      </Card>

      <Card style={{ gap: 10 }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Things you have unlocked</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {UNLOCKABLES.map((u) => {
            const locked = u.level > level;
            const on = equipped === u.id && !locked;
            return (
              <Pressable
                key={u.id}
                accessibilityRole="button"
                disabled={locked}
                accessibilityState={{ disabled: locked, selected: on }}
                onPress={async () => {
                  await setSetting(EQUIPPED_SETTING, u.id);
                  setEquipped(u.id);
                  onChanged();
                }}
                style={{ opacity: locked ? 0.45 : 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accent : 'transparent' }}>
                <Text style={{ color: on ? '#fff' : t.text, fontSize: 13 }}>
                  {u.name}{locked ? ` · level ${u.level}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Sub>Locked items arrive on their own as you level up. Nothing is ever taken away.</Sub>
      </Card>

      <Card style={{ gap: 10 }}>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Your data</Text>
        <Sub>
          {DB_IS_ENCRYPTED
            ? 'Everything lives in an encrypted database on this phone. A backup is encrypted separately, with a key only you hold.'
            : 'This is the web preview, so the database here is not encrypted. Backups still are.'}
        </Sub>

        <Button
          label={busy ? 'Working…' : 'Export an encrypted backup'}
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            setNote('');
            try {
              const { payload, recoveryKey: rk, filename } = await createBackup();
              await saveBackup(filename, payload);
              setRecoveryKey(rk);
              say('Backup created. Copy the recovery key below and keep it somewhere safe — it is not stored anywhere and cannot be recovered.');
            } catch (e) {
              say(`Export did not finish: ${e instanceof Error ? e.message : 'unknown error'}`);
            } finally {
              setBusy(false);
            }
          }}
        />

        {recoveryKey && (
          <View style={{ gap: 6, borderWidth: 1, borderColor: t.accent, borderRadius: 14, padding: 12 }}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 13 }}>Recovery key — shown once</Text>
            <TextInput
              value={recoveryKey}
              editable={false}
              multiline
              selectTextOnFocus
              style={{ color: t.text, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
            />
            <Button label="I have saved it" kind="ghost" onPress={() => setRecoveryKey(null)} />
          </View>
        )}

        <View style={{ height: 1, backgroundColor: t.line, marginVertical: 4 }} />

        <TextInput
          value={importKey}
          onChangeText={setImportKey}
          placeholder="Recovery key of the backup you want to restore"
          placeholderTextColor={t.sub}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          style={{ color: t.text, fontSize: 13, borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 10, minHeight: 60 }}
        />
        <Button
          label={busy ? 'Working…' : 'Restore from a backup'}
          kind="ghost"
          disabled={busy || !importKey.trim()}
          onPress={() => {
            const go = async () => {
              setBusy(true);
              setNote('');
              try {
                const payload = await loadBackup();
                if (payload === null) {
                  say('No file chosen. Nothing changed.');
                  return;
                }
                const restored = await restoreBackup(payload, importKey);
                setImportKey('');
                await load();
                onChanged();
                say(`Restored ${describeSnapshot(restored)}.`);
              } catch (e) {
                say(e instanceof BackupError ? e.message : `Restore did not finish: ${e instanceof Error ? e.message : 'unknown error'}`);
              } finally {
                setBusy(false);
              }
            };
            // Restoring replaces what is here, so it always asks first.
            if (Platform.OS === 'web') {
              // eslint-disable-next-line no-alert
              if (typeof confirm === 'function' && !confirm('Restoring replaces everything currently in this preview. Continue?')) return;
              go();
              return;
            }
            Alert.alert(
              'Replace what is here?',
              'Restoring a backup replaces the check-ins, habits and timeline on this device.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Restore', style: 'destructive', onPress: () => { go(); } },
              ],
            );
          }}
        />
        <Sub>A backup can only be opened with its own recovery key. Without the key the file is unreadable, including by you.</Sub>
      </Card>

      {!!note && (
        <Card>
          <Sub>{note}</Sub>
        </Card>
      )}

      <Button
        label="Re-check habit reminders"
        kind="ghost"
        disabled={!REMINDERS_SUPPORTED}
        onPress={async () => {
          const ok = await syncHabitReminders(await listHabits(true));
          setPermission(await getPermission());
          say(ok ? 'Habit reminders are up to date.' : 'Notifications are off, so no habit reminders are scheduled.');
        }}
      />
    </ScrollView>
  );
}
