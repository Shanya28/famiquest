import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { Card, Pill, Button } from '../../components/UI';
import { C } from '../../theme';

export default function ValidationScreen() {
  const {
    children, tasks, redemptions,
    approveTask, rejectTask, adjustScreen, resolveRedemption,
  } = useApp();
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const pendingBuys = redemptions.filter((r) => r.status === 'pending');

  const askReject = (task) => {
    // Menu de raisons : fonctionne sur Android ET iPhone
    Alert.alert(
      'Pourquoi refuser ?',
      "La mission repassera « à refaire » chez l'enfant, avec la raison choisie.",
      [
        { text: '\uD83D\uDCF7 Photo floue / illisible', onPress: () => rejectTask(task, 'Photo floue ou illisible') },
        { text: '\u2717 Tâche non terminée', onPress: () => rejectTask(task, "La tâche n'est pas terminée") },
        { text: 'Refuser sans raison', onPress: () => rejectTask(task, '') },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const approve = async (task) => {
    const result = await approveTask(task);
    const child = children.find((c) => c.id === task.childId);
    Alert.alert('✅ Validé', `Récompenses envoyées à ${child?.name}.${result?.badges?.length ? ' 🏅 Nouveau badge débloqué !' : ''}`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={styles.container}>
      {/* ---- Preuves photo ---- */}
      <Text style={styles.section}>
        Preuves à valider {pendingTasks.length > 0 ? `(${pendingTasks.length})` : ''}
      </Text>
      {pendingTasks.length === 0 && (
        <Card style={{ alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 32 }}>🎉</Text>
          <Text style={{ fontWeight: '800', color: C.ink, marginTop: 6 }}>Aucune preuve en attente</Text>
          <Text style={styles.emptyText}>Les photos envoyées par vos enfants apparaîtront ici en temps réel.</Text>
        </Card>
      )}
      {pendingTasks.map((t) => {
        const child = children.find((c) => c.id === t.childId);
        return (
          <Card key={t.id}>
            <View style={styles.rowHeader}>
              <Text style={{ fontSize: 26 }}>{child?.avatar}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle}>{t.title}</Text>
                <Text style={styles.taskMeta}>{child?.name}</Text>
              </View>
            </View>
            {t.proofUrl ? (
              <Image source={{ uri: t.proofUrl }} style={styles.proof} resizeMode="cover" />
            ) : (
              <View style={[styles.proof, styles.proofEmpty]}>
                <Text style={{ fontSize: 40 }}>📷</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title={`✓ Valider (+${t.xp} XP)`} bg={C.mint} style={{ flex: 1 }} onPress={() => approve(t)} />
              <Button title="✕ Refuser" bg={C.coralSoft} color={C.coralText} style={{ flex: 1 }} onPress={() => askReject(t)} />
            </View>
          </Card>
        );
      })}

      {/* ---- Achats boutique ---- */}
      <Text style={styles.section}>
        Achats boutique {pendingBuys.length > 0 ? `(${pendingBuys.length})` : ''}
      </Text>
      {pendingBuys.length === 0 && (
        <Card style={{ alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 28 }}>🛍️</Text>
          <Text style={styles.emptyText}>
            Quand un enfant achète une récompense avec ses pièces, confirmez ici que vous la lui remettez.
          </Text>
        </Card>
      )}
      {pendingBuys.map((r) => {
        const child = children.find((c) => c.id === r.childId);
        return (
          <Card key={r.id} style={styles.buyRow}>
            <Text style={{ fontSize: 26 }}>{r.rewardIcon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>{r.rewardTitle}</Text>
              <Text style={styles.taskMeta}>{child?.avatar} {child?.name} · 🪙 {r.cost} pièces</Text>
            </View>
            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: C.mintSoft }]}
              onPress={() => resolveRedemption(r, true)}
            >
              <Text style={{ color: C.mintText, fontWeight: '900' }}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: C.coralSoft }]}
              onPress={() =>
                Alert.alert('Refuser ?', `Les ${r.cost} pièces seront remboursées à ${child?.name}.`, [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Refuser', style: 'destructive', onPress: () => resolveRedemption(r, false) },
                ])
              }
            >
              <Text style={{ color: C.coralText, fontWeight: '900' }}>✕</Text>
            </TouchableOpacity>
          </Card>
        );
      })}

      {/* ---- Temps d'écran ---- */}
      <Text style={styles.section}>Contrôle du temps d'écran</Text>
      {children.map((c) => (
        <Card key={c.id} style={styles.screenRow}>
          <Text style={{ fontSize: 26 }}>{c.avatar}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{c.name}</Text>
            <Text style={styles.taskMeta}>🎮 {c.screenMinutes || 0} min disponibles</Text>
          </View>
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: C.coralSoft }]}
            onPress={() => (c.screenMinutes || 0) >= 15 && adjustScreen(c.id, -15)}
          >
            <Text style={{ color: C.coralText, fontWeight: '900', fontSize: 16 }}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: C.mintSoft }]}
            onPress={() => adjustScreen(c.id, 15)}
          >
            <Text style={{ color: C.mintText, fontWeight: '900', fontSize: 16 }}>+</Text>
          </TouchableOpacity>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 30 },
  section: { fontSize: 16, fontWeight: '800', color: C.ink, marginTop: 4 },
  emptyText: { fontSize: 12, color: C.inkSoft, textAlign: 'center', marginTop: 4 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskTitle: { fontWeight: '800', color: C.ink, fontSize: 14 },
  taskMeta: { fontSize: 12, color: C.inkSoft },
  proof: { height: 170, borderRadius: 14, marginVertical: 12, backgroundColor: C.bg },
  proofEmpty: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.violetSoft, borderStyle: 'dashed' },
  buyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  screenRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  smallBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
