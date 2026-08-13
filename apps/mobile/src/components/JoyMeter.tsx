import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { meterLabel } from '@/store/useAppStore';

export function JoyMeter({ points }: { points: number }) {
  const pct = Math.min(100, Math.max(0, points));
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>Saldo de Alegria</Text>
        <Text style={styles.points}>{pct}/100</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.label}>{meterLabel(pct)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  points: { fontSize: 14, color: colors.olive, fontWeight: '700' },
  track: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.gold,
  },
  label: { fontSize: 13, color: colors.textMuted },
});
