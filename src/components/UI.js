import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, shadow } from '../theme';

export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const Pill = ({ bg, color, children, style }) => (
  <View style={[styles.pill, { backgroundColor: bg }, style]}>
    <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{children}</Text>
  </View>
);

export const ProgressBar = ({ value, max, color, bg, height = 10 }) => {
  const pct = Math.min(100, Math.round(((value || 0) / max) * 100));
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, height, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, backgroundColor: color, height: '100%', borderRadius: 999 }} />
    </View>
  );
};

export const Button = ({ title, onPress, bg = C.violet, color = '#fff', disabled, style }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
    style={[styles.btn, { backgroundColor: disabled ? '#E4E2F0' : bg }, style]}
  >
    <Text style={{ color: disabled ? '#A6A3C2' : color, fontWeight: '800', fontSize: 14 }}>{title}</Text>
  </TouchableOpacity>
);

/** Jauge signature : temps de jeu gagné par l'enfant */
export const ScreenGauge = ({ minutes }) => {
  const pct = Math.min(100, ((minutes || 0) / 120) * 100);
  return (
    <View style={styles.gauge}>
      <Text style={styles.gaugeGhost}>🎮</Text>
      <Text style={styles.gaugeLabel}>TEMPS DE JEU GAGNÉ</Text>
      <Text style={styles.gaugeValue}>{minutes || 0} min</Text>
      <View style={styles.gaugeTrack}>
        <View style={[styles.gaugeFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.gaugeHint}>Chaque mission accomplie recharge ta manette 🕹️</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 20, padding: 16, ...shadow },
  pill: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
  },
  btn: { borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  gauge: { backgroundColor: C.violet, borderRadius: 22, padding: 18, overflow: 'hidden' },
  gaugeGhost: { position: 'absolute', right: -12, top: -14, fontSize: 84, opacity: 0.14 },
  gaugeLabel: { color: '#fff', opacity: 0.85, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  gaugeValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginVertical: 6 },
  gaugeTrack: { backgroundColor: 'rgba(255,255,255,.25)', borderRadius: 999, height: 12, overflow: 'hidden' },
  gaugeFill: { backgroundColor: C.sun, height: '100%', borderRadius: 999 },
  gaugeHint: { color: '#fff', opacity: 0.8, fontSize: 11, marginTop: 6 },
});
