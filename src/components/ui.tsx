import React from 'react';
import { Pressable, Text, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View
      style={[
        { backgroundColor: t.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: t.line },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  kind = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  kind?: 'primary' | 'ghost';
}) {
  const t = useTheme();
  const primary = kind === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.5 : 1,
        backgroundColor: primary ? t.accent : 'transparent',
        borderColor: t.accent,
        borderWidth: primary ? 0 : 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: primary ? '#fff' : t.accent, fontSize: 16, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function H({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={{ color: t.text, fontSize: 26, fontWeight: '700', marginBottom: 4 }}>{children}</Text>;
}

export function Sub({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={{ color: t.sub, fontSize: 15, lineHeight: 21 }}>{children}</Text>;
}
