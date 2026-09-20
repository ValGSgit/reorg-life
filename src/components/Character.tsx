import React from 'react';
import { View, Image, ImageSourcePropType } from 'react-native';
import { characterArt } from '../characterArt';
import type { CharacterId } from '../domain';
import { NO_ITEM, Unlockable } from '../domain';

type Props = {
  color: string;
  mood?: number;
  size?: number;
  /** Looks up generated art for this character; falls back to the blob. */
  id?: CharacterId;
  /** Explicit override, mostly for previews. */
  image?: ImageSourcePropType;
  /** Accessory earned by levelling up. */
  item?: Unlockable;
};

/**
 * Draws the companion: generated artwork when `assets/characters/` has it,
 * otherwise the hand-rolled blob so the app is never missing a character.
 * Unlocked accessories are drawn over either one.
 */
export function Character({ color, mood = 3, size = 120, id, image, item = NO_ITEM }: Props) {
  const source = image ?? characterArt(id, mood);
  const eye = size * 0.09;
  const smile = mood >= 4 ? 1 : mood <= 2 ? -1 : 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      {item.kind === 'halo' && (
        <View
          style={{
            position: 'absolute',
            width: size * 0.94,
            height: size * 0.94,
            borderRadius: size * 0.47,
            backgroundColor: item.color,
            opacity: 0.22,
          }}
        />
      )}

      {source ? (
        <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
      ) : (
        <View
          style={{
            width: size * 0.8,
            height: size * 0.86,
            backgroundColor: color,
            borderTopLeftRadius: size * 0.4,
            borderTopRightRadius: size * 0.4,
            borderBottomLeftRadius: size * 0.26,
            borderBottomRightRadius: size * 0.26,
            alignItems: 'center',
            paddingTop: size * 0.28,
          }}
        >
          <View style={{ flexDirection: 'row', gap: size * 0.2 }}>
            <View
              style={{
                width: eye,
                height: mood <= 1 ? eye * 0.4 : eye * 1.3,
                borderRadius: eye,
                backgroundColor: '#2B2A33',
              }}
            />
            <View
              style={{
                width: eye,
                height: mood <= 1 ? eye * 0.4 : eye * 1.3,
                borderRadius: eye,
                backgroundColor: '#2B2A33',
              }}
            />
          </View>
          <Mouth size={size} kind={smile} />
        </View>
      )}

      <Accessory size={size} item={item} />
    </View>
  );
}

/** The earned extras, drawn on top of whichever body is showing. */
function Accessory({ size, item }: { size: number; item: Unlockable }) {
  switch (item.kind) {
    case 'sprig':
      return (
        <View style={{ position: 'absolute', top: size * 0.02, left: size * 0.56 }}>
          <View
            style={{
              width: size * 0.04,
              height: size * 0.16,
              backgroundColor: item.color,
              borderRadius: size * 0.02,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: size * 0.03,
              width: size * 0.13,
              height: size * 0.08,
              backgroundColor: item.color,
              borderTopRightRadius: size * 0.08,
              borderBottomLeftRadius: size * 0.08,
            }}
          />
        </View>
      );
    case 'scarf':
      return (
        <View
          style={{
            position: 'absolute',
            bottom: size * 0.16,
            width: size * 0.66,
            height: size * 0.1,
            backgroundColor: item.color,
            borderRadius: size * 0.05,
          }}
        />
      );
    case 'hat':
      return (
        <View style={{ position: 'absolute', top: size * 0.0, alignItems: 'center' }}>
          <View
            style={{
              width: size * 0.3,
              height: size * 0.16,
              backgroundColor: item.color,
              borderTopLeftRadius: size * 0.15,
              borderTopRightRadius: size * 0.15,
            }}
          />
          <View
            style={{
              width: size * 0.5,
              height: size * 0.05,
              backgroundColor: item.color,
              borderRadius: size * 0.03,
            }}
          />
        </View>
      );
    case 'stars':
      return (
        <View style={{ position: 'absolute', top: size * 0.04, flexDirection: 'row', gap: size * 0.1 }}>
          {[0.7, 1, 0.7].map((scale, i) => (
            <View
              key={i}
              style={{
                width: size * 0.07 * scale,
                height: size * 0.07 * scale,
                backgroundColor: item.color,
                transform: [{ rotate: '45deg' }],
                borderRadius: size * 0.012,
              }}
            />
          ))}
        </View>
      );
    default:
      return null;
  }
}

function Mouth({ size, kind }: { size: number; kind: number }) {
  const w = size * 0.025;
  const base = { marginTop: size * 0.1, width: size * 0.22, borderColor: '#2B2A33' } as const;
  if (kind === 0) return <View style={{ ...base, height: 0, borderBottomWidth: w }} />;
  if (kind > 0)
    return (
      <View
        style={{
          ...base,
          height: size * 0.1,
          borderBottomWidth: w,
          borderLeftWidth: w,
          borderRightWidth: w,
          borderBottomLeftRadius: size * 0.11,
          borderBottomRightRadius: size * 0.11,
        }}
      />
    );
  return (
    <View
      style={{
        ...base,
        height: size * 0.08,
        borderTopWidth: w,
        borderLeftWidth: w,
        borderRightWidth: w,
        borderTopLeftRadius: size * 0.11,
        borderTopRightRadius: size * 0.11,
      }}
    />
  );
}
