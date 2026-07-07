import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Card, Pill } from '../../components/UI';
import { BADGES } from '../../utils/gamification';
import { C } from '../../theme';

export default function RewardsScreen() {
  const { session, children } = useApp();
  const child = children.find((c) => c.id === session.childId);
  if (!child) return null;
  const ranking = [...children].sort((a, b) => (b.xp || 0) - (a.xp || 0));
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={styles.container}>
      <Text style={styles.section}>Mes badges</Text>
      <View style={styles.grid}>
        {Object.entries(BADGES).map(([key, b]) => {
          const unlocked = (child.badges || []).includes(key);
          return (
            <Card key={key} style={[styles.badge, !unlocked && { opacity: 0.4 }]}>
              <Text style={{ fontSize: 30 }}>{b.icon}</Text>
              <Text style={styles.badgeName}>{b.name}</Text>
              <Text style={styles.badgeDesc}>{b.desc}</Text>
              {unlocked && <Pill bg={C.mintSoft} color={C.mintText} style={{ marginTop: 6 }}>Débloqué ✓</Pill>}
            </Card>
          );
        })}
      </View>

      <Text style={styles.section}>Classement familial</Text>
      {ranking.map((c, i) => (
        <Card
          key={c.id}
          style={[styles.rankRow, c.id === child.id && { borderWidth: 2, borderColor: C.violet }]}
        >
          <Text style={styles.rankMedal}>{medals[i] || `${i + 1}.`}</Text>
          <Text style={{ fontSize: 26 }}>{c.avatar}</Text>
          <Text style={styles.rankName}>{c.name}{c.id === child.id ? ' (toi)' : ''}</Text>
          <Pill bg={C.violetSoft} color={C.violetDark}>{c.xp || 0} XP</Pill>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 30 },
  section: { fontSize: 16, fontWeight: '800', color: C.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '47.8%', alignItems: 'center', padding: 14 },
  badgeName: { fontWeight: '800', fontSize: 13, color: C.ink, marginTop: 4, textAlign: 'center' },
  badgeDesc: { fontSize: 11, color: C.inkSoft, textAlign: 'center' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankMedal: { fontSize: 20, width: 30, textAlign: 'center' },
  rankName: { flex: 1, fontWeight: '800', color: C.ink },
});
