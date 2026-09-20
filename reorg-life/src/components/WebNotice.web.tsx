import React from 'react';
import { Text, View } from 'react-native';

/**
 * Permanent reminder that the browser preview does not have the guarantees
 * the phone app does: no SQLCipher, no OS keystore, no notifications.
 */
export function WebNotice() {
  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: '#8A5A00',
        paddingVertical: 8,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}>
      <Text style={{ color: '#FFF3DB', fontSize: 12, lineHeight: 17, flex: 1 }}>
        Web preview — not secure. This browser copy stores your entries unencrypted and
        reminders are off. Use the Android app for real data.
      </Text>
    </View>
  );
}
