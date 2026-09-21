/**
 * Pure domain logic: XP, levels, streaks, unlockables, life areas, companions.
 *
 * Nothing in this folder may import React, react-native or any Expo module.
 * That is what keeps it unit-testable in plain Node, and CI enforces a
 * coverage floor here. See src/domain/README.md.
 */
export * from './characters';
export * from './companion';
export * from './domains';
export * from './grouping';
export * from './streaks';
export * from './time';
export * from './unlockables';
export * from './xp';
