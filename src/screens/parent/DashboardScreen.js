import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Card, Pill } from '../../components/UI';
import {
  levelOf, levelTitle, last7Days, DAY_LETTERS, isScheduledToday, effectiveStatus,
} from '../../utils/gamification';
import { C } from '../../theme';

export default function DashboardScreen() {
  const { children, tasks, history, reports } = useApp();
  const [openReport, setOpenReport] = useState(null);
  const days = last7Days();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={styles.container}>
      {children.length === 0 && (
        <Card style={{ alignItems: 'center', padding: 26 }}>
          <Text style={{ fontSize: 34 }}>👋</Text>
          <Text style={{ fontWeight: '800', color: C.ink, marginTop: 6 }}>Bienvenue !</Text>
          <Text style={styles.emptyText}>
            Ajoutez un enfant depuis l'écran de profils, puis créez ses premières tâches dans l'onglet Tâches.
          </Text>
        </Card>
      )}

      {children.map((child) => {
        // Statuts du jour (avec détection automatique des retards)
        const myTasks = tasks
          .filter((t) => t.childId === child.id && isScheduledToday(t))
          .map((t) => ({ ...t, status: effectiveStatus(t) }));
        const doneToday = myTasks.filter((t) => t.status === 'done').length;
        const late = myTasks.filter((t) => t.status === 'late').length;
        const pending = myTasks.filter((t) => t.status === 'pending').length;
        const rate = myTasks.length ? Math.round((doneToday / myTasks.length) * 100) : 0;

        // Vraies données : agrégats quotidiens de la collection "history"
        const week = days.map((date) => {
          const h = history.find((x) => x.childId === child.id && x.date === date);
          return h?.done || 0;
        });
        const maxDone = Math.max(1, ...week);
        const weekTotal = week.reduce((a, b) => a + b, 0);

        return (
          <Card key={child.id}>
            <View style={styles.childHeader}>
              <Text style={{ fontSize: 30 }}>{child.avatar}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.childName}>
                  {child.name}{' '}
                  <Text style={styles.childMeta}>· Niv. {levelOf(child.xp)} · 🔥 {child.streak || 0} j</Text>
                </Text>
                <Text style={styles.childScreen}>
                  ⭐ {levelTitle(child.xp)} · 🎮 {child.screenMinutes || 0} min en réserve
                </Text>
              </View>
              <Pill bg={rate >= 70 ? C.mintSoft : C.sunSoft} color={rate >= 70 ? C.mintText : C.sunText}>
                {rate}% auj.
              </Pill>
            </View>

            {/* Graphique : tâches validées par jour (7 derniers jours, données réelles) */}
            <View style={styles.chart}>
              {week.map((v, i) => {
                const jsDay = new Date(days[i] + 'T12:00:00').getDay();
                const isToday = i === week.length - 1;
                return (
                  <View key={i} style={styles.chartCol}>
                    {v > 0 && <Text style={styles.barValue}>{v}</Text>}
                    <View style={[styles.bar, {
                      height: Math.max(8, (v / maxDone) * 52),
                      backgroundColor: isToday ? C.violet : v > 0 ? '#B9AFF5' : C.violetSoft,
                    }]} />
                    <Text style={[styles.day, isToday && { color: C.violet }]}>{DAY_LETTERS[jsDay]}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.chartCaption}>
              {weekTotal} tâche{weekTotal > 1 ? 's' : ''} validée{weekTotal > 1 ? 's' : ''} ces 7 derniers jours
            </Text>

            <View style={styles.pillRow}>
              <Pill bg={C.mintSoft} color={C.mintText}>✓ {doneToday} terminées</Pill>
              {pending > 0 && <Pill bg={C.sunSoft} color={C.sunText}>👀 {pending} à valider</Pill>}
              {late > 0 && <Pill bg={C.coralSoft} color={C.coralText}>⏰ {late} en retard</Pill>}
            </View>
          </Card>
        );
      })}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14, paddingBottom: 30 },
  emptyText: { fontSize: 12, color: C.inkSoft, textAlign: 'center', marginTop: 4 },
  childHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  childName: { fontWeight: '800', color: C.ink, fontSize: 15 },
  childMeta: { color: C.inkSoft, fontWeight: '600', fontSize: 12 },
  childScreen: { fontSize: 12, color: C.inkSoft },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 78, marginBottom: 4 },
  chartCol: { flex: 1, alignItems: 'center', gap: 3, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6 },
  barValue: { fontSize: 9, fontWeight: '800', color: C.violetDark },
  day: { fontSize: 9, color: C.inkSoft, fontWeight: '700' },
  chartCaption: { fontSize: 11, color: C.inkSoft, marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  section: { fontSize: 16, fontWeight: '800', color: C.ink, marginTop: 4 },
  aiText: { fontSize: 13, color: C.ink, lineHeight: 19 },
});
