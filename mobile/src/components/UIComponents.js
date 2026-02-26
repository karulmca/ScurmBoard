/**
 * Reusable primitive components used across all screens.
 *
 * TypeBadge   — coloured pill showing work item type
 * StatePill   — state label with background
 * PriDot      — coloured priority dot
 * Avatar      — initials circle
 * EmptyState  — centred empty message
 * Spinner     — loading indicator
 * Divider     — horizontal rule
 * Tag         — small tag chip
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../theme';
import { getTypeInfo, getStateInfo, getPriorityInfo } from '../constants';

// ── TypeBadge ─────────────────────────────────────────────────────────────────
export function TypeBadge({ type, size = 'md' }) {
  const info = getTypeInfo(type);
  const isSmall = size === 'sm';
  return (
    <View style={[styles.typeBadge, { backgroundColor: info.color + '22', borderColor: info.color }]}>
      <Text style={[styles.typeBadgeIcon, isSmall && styles.textSm]}>{info.icon}</Text>
      <Text style={[styles.typeBadgeLabel, { color: info.color }, isSmall && styles.textSm]}>
        {type}
      </Text>
    </View>
  );
}

// ── StatePill ─────────────────────────────────────────────────────────────────
export function StatePill({ state }) {
  const info = getStateInfo(state);
  return (
    <View style={[styles.statePill, { backgroundColor: info.color + '22', borderColor: info.color }]}>
      <View style={[styles.stateDot, { backgroundColor: info.color }]} />
      <Text style={[styles.statePillLabel, { color: info.color }]}>{state}</Text>
    </View>
  );
}

// ── PriDot ────────────────────────────────────────────────────────────────────
export function PriDot({ priority }) {
  const info = getPriorityInfo(priority);
  return (
    <View style={styles.priDotRow}>
      <View style={[styles.priDot, { backgroundColor: info.color }]} />
      <Text style={[styles.priLabel, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 28 }) {
  const initials = (name || '?')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  // stable colour from name hash
  const colours = [
    '#0078d4', '#9c27b0', '#00b4a2', '#f8a131',
    '#e53935', '#2196f3', '#8bc34a', '#ff5722',
  ];
  let hash = 0;
  for (const c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  const bg = colours[Math.abs(hash) % colours.length];

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📋', message = 'Nothing here yet.' }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyMsg}>{message}</Text>
    </View>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ style }) {
  return (
    <View style={[styles.spinnerWrap, style]}>
      <ActivityIndicator size="large" color={COLORS.accent} />
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({ label }) {
  return (
    <View style={styles.tagChip}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // TypeBadge
  typeBadge: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical:   3,
    borderRadius:   RADIUS.sm,
    borderWidth:    1,
    alignSelf:      'flex-start',
    gap:            4,
  },
  typeBadgeIcon:  { fontSize: TYPOGRAPHY.sizeSm },
  typeBadgeLabel: { fontSize: TYPOGRAPHY.sizeSm, fontWeight: TYPOGRAPHY.weightMedium },
  textSm:         { fontSize: TYPOGRAPHY.sizeXs },

  // StatePill
  statePill: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical:   3,
    borderRadius:   RADIUS.full,
    borderWidth:    1,
    alignSelf:      'flex-start',
    gap:            5,
  },
  stateDot:      { width: 6, height: 6, borderRadius: 3 },
  statePillLabel:{ fontSize: TYPOGRAPHY.sizeSm, fontWeight: TYPOGRAPHY.weightMedium },

  // PriDot
  priDotRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  priDot:    { width: 8, height: 8, borderRadius: 4 },
  priLabel:  { fontSize: TYPOGRAPHY.sizeSm, fontWeight: TYPOGRAPHY.weightMedium },

  // Avatar
  avatar:     { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontWeight: TYPOGRAPHY.weightBold },

  // EmptyState
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyMsg:  { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizeMd, textAlign: 'center' },

  // Spinner
  spinnerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Divider
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },

  // Tag
  tagChip: {
    backgroundColor:  COLORS.surfaceAlt,
    borderColor:      COLORS.border,
    borderWidth:      1,
    borderRadius:     RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical:  2,
  },
  tagText: { fontSize: TYPOGRAPHY.sizeXs, color: COLORS.textSecondary },
});
