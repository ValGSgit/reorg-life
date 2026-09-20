import React from 'react';
import { View, Image, ImageSourcePropType } from 'react-native';
import { characterArt } from '../characterArt';
import type { CharacterId } from '../domain';

type Props = {
  color: string;
  mood?: number;
  size?: number;
  /** Looks up generated art for this character; falls back to the blob. */
  id?: CharacterId;
  /** Explicit override, mostly for previews. */
  image?: ImageSourcePropType;
};

/**
 * Draws the companion: generated artwork when `assets/characters/` has it,
 * otherwise the hand-rolled blob so the app is never missing a character.
 */
export function Character({ color, mood = 3, size = 120, id, image }: Props) {
  const source = image ?? characterArt(id, mood);
  if (source) return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />;

  const eye = size * 0.09;
  const smile = mood >= 4 ? 1 : mood <= 2 ? -1 : 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ width: size * 0.8, height: size * 0.86, backgroundColor: color, borderTopLeftRadius: size * 0.4, borderTopRightRadius: size * 0.4, borderBottomLeftRadius: size * 0.26, borderBottomRightRadius: size * 0.26, alignItems: 'center', paddingTop: size * 0.28 }}>
        <View style={{ flexDirection: 'row', gap: size * 0.2 }}>
          <View style={{ width: eye, height: mood <= 1 ? eye * 0.4 : eye * 1.3, borderRadius: eye, backgroundColor: '#2B2A33' }} />
          <View style={{ width: eye, height: mood <= 1 ? eye * 0.4 : eye * 1.3, borderRadius: eye, backgroundColor: '#2B2A33' }} />
        </View>
        <Mouth size={size} kind={smile} />
      </View>
    </View>
  );
}

function Mouth({ size, kind }: { size: number; kind: number }) {
  const w = size * 0.025;
  const base = { marginTop: size * 0.1, width: size * 0.22, borderColor: '#2B2A33' } as const;
  if (kind === 0) return <View style={{ ...base, height: 0, borderBottomWidth: w }} />;
  if (kind > 0) return <View style={{ ...base, height: size * 0.1, borderBottomWidth: w, borderLeftWidth: w, borderRightWidth: w, borderBottomLeftRadius: size * 0.11, borderBottomRightRadius: size * 0.11 }} />;
  return <View style={{ ...base, height: size * 0.08, borderTopWidth: w, borderLeftWidth: w, borderRightWidth: w, borderTopLeftRadius: size * 0.11, borderTopRightRadius: size * 0.11 }} />;
}
