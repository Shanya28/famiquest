import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useApp } from '../../context/AppContext';
import { Card, Pill, ProgressBar, ScreenGauge, Button } from '../../components/UI';
import Celebration from '../../components/Celebration';
import {
  levelOf, xpInLevel, levelTitle, isScheduledToday, effectiveStatus,
} from '../../utils/gamification';
import { C } from '../../theme';

export default function MissionsScreen() {
  const {
    session, children, tasks, completeTask, submitProof, spendScreen,
    celebration, clearCelebration,
  } = useApp();
  const child = children.find((c) => c.id === session.childId);
  const [busy, setBusy] = useState(null);

  if (!child) return null;
  const myTasks = tasks
    .filter((t) => t.childId === child.id && isScheduledToday(t))
    .map((t) => ({ ...t, status: effectiveStatus(t) }));
  const done = myTasks.filter((t) => t.status === 'done').length;

  // Envoie la photo choisie (camera ou galerie) : compression + upload
  const chooseAndSubmit = async (task, useCamera) => {
    try {
      let perm;
      if (useCamera) {
        perm = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      if (!perm.granted) {
        Alert.alert(
          'Autorisation nécessaire',
          useCamera
            ? "L'accès à l'appareil photo est bloqué. Ouvre les réglages pour l'autoriser."
            : "L'accès aux photos est bloqué. Ouvre les réglages pour l'autoriser.",
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const opts = { quality: 0.7, allowsEditing: true, aspect: [4, 3] };
      const result = useCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);

      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) { Alert.alert('Oups', "Aucune image n'a été reçue. Réessaie."); return; }

      setBusy(task.id);
      const small = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 700 } }],
        { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      await submitProof(task, `data:image/jpeg;base64,${small.base64}`);
      Alert.alert('📤 Envoyé !', 'Tes parents vont vérifier ta mission 👀');
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'envoyer la photo : " + (e?.message || 'erreur inconnue'));
    } finally {
      setBusy(null);
    }
  };

  const handleComplete = async (task) => {
    if (!task.proofRequired) {
      await completeTask(task); // la célébration s'affiche via le contexte
      return;
    }
    // Choix Camera / Galerie : le sélecteur système fonctionne sur tous les téléphones
    Alert.alert(
      '📸 Preuve de ta mission',
      'Comment veux-tu envoyer ta preuve ?',
      [
        { text: '📷 Prendre une photo', onPress: () => chooseAndSubmit(task, true) },
        { text: '🖼️ Choisir dans la galerie', onPress: () => chooseAndSubmit(task, false) },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const useScreenTime = () => {
    Alert.alert('🕹️ Utiliser 15 min ?', 'Ton compteur sera débité de 15 minutes.', [
      { text: 'Annuler', style: 'cancel' },
      { text: "C'est parti !", onPress: () => spendScreen(child.id, 15) },
    ]);
  };

  return (
    <>
      <Celebration data={celebration} onClose={clearCelebration} />
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={styles.container}>
        {/* En-tête */}
        <Card style={styles.header}>
          <View style={styles.avatar}><Text style={{ fontSize: 34 }}>{child.avatar}</Text></View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.hello}>Salut {child.name} !</Text>
              <Pill bg={C.violetSoft} color={C.violetDark}>Niv. {levelOf(child.xp)}</Pill>
            </View>
            <Text style={styles.levelTitle}>⭐ {levelTitle(child.xp)}</Text>
            <View style={{ marginVertical: 5 }}>
              <ProgressBar value={xpInLevel(child.xp)} max={100} color={C.violet} bg={C.violetSoft} height={8} />
            </View>
            <Text style={styles.xpText}>{xpInLevel(child.xp)}/100 XP vers le niveau {levelOf(child.xp) + 1}</Text>
          </View>
        </Card>

        {/* Compteurs */}
        <View style={styles.statsRow}>
          <Card style={styles.stat}><Text style={styles.statIcon}>🪙</Text><Text style={styles.statVal}>{child.coins || 0}</Text><Text style={styles.statLabel}>pièces</Text></Card>
          <Card style={styles.stat}><Text style={styles.statIcon}>🔥</Text><Text style={styles.statVal}>{child.streak || 0}</Text><Text style={styles.statLabel}>série</Text></Card>
          <Card style={styles.stat}><Text style={styles.statIcon}>✅</Text><Text style={styles.statVal}>{done}/{myTasks.length}</Text><Text style={styles.statLabel}>missions</Text></Card>
        </View>

        {/* Temps d'écran */}
        <ScreenGauge minutes={child.screenMinutes} />
        <Button
          title="🕹️ Utiliser 15 min de jeu" bg={C.sun} color="#5C3A00"
          disabled={(child.screenMinutes || 0) < 15} onPress={useScreenTime}
        />

        <Text style={styles.section}>Missions du jour</Text>
        {myTasks.length === 0 && (
          <Card style={{ alignItems: 'center', padding: 26 }}>
            <Text style={{ fontSize: 34 }}>🌈</Text>
            <Text style={{ fontWeight: '800', color: C.ink, marginTop: 6 }}>Pas de mission aujourd'hui</Text>
            <Text style={{ fontSize: 12, color: C.inkSoft, textAlign: 'center', marginTop: 2 }}>
              Profite de ta journée ou demande une mission bonus à tes parents !
            </Text>
          </Card>
        )}
        {myTasks.map((t) => (
          <TaskRow key={t.id} task={t} busy={busy === t.id} onComplete={handleComplete} />
        ))}
      </ScrollView>
    </>
  );
}

function TaskRow({ task, busy, onComplete }) {
  const cfg = {
    todo: { label: 'À faire', bg: C.skySoft, color: C.skyText },
    late: { label: 'En retard', bg: C.coralSoft, color: C.coralText },
    pending: { label: 'En attente 👀', bg: C.sunSoft, color: C.sunText },
    done: { label: 'Terminé ✓', bg: C.mintSoft, color: C.mintText },
  }[task.status] || { label: task.status, bg: C.bg, color: C.inkSoft };
  const actionable = task.status === 'todo' || task.status === 'late';

  return (
    <Card style={[
      styles.taskRow,
      task.status === 'done' && { opacity: 0.6 },
      task.status === 'late' && { borderWidth: 2, borderColor: C.coralSoft },
    ]}>
      <View style={[styles.taskIcon, task.status === 'done' && { backgroundColor: C.mint }]}>
        {task.status === 'done'
          ? <Text style={{ fontSize: 22, color: '#fff', fontWeight: '900' }}>{'\u2713'}</Text>
          : <Text style={{ fontSize: 24 }}>{task.icon}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.taskTitle, task.status === 'done' && { textDecorationLine: 'line-through' }]}>
          {task.title}
        </Text>
        <View style={styles.pillRow}>
          <Pill bg={task.status === 'late' ? C.coralSoft : C.bg} color={task.status === 'late' ? C.coralText : C.inkSoft}>
            🕐 {task.time}
          </Pill>
          <Pill bg={C.violetSoft} color={C.violetDark}>+{task.xp} XP</Pill>
          <Pill bg={C.sunSoft} color={C.sunText}>🎮 +{task.screenMin}m</Pill>
        </View>
      </View>
      {busy ? (
        <ActivityIndicator color={C.violet} />
      ) : actionable ? (
        <TouchableOpacity style={styles.doneBtn} onPress={() => onComplete(task)}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
            {task.proofRequired ? '📸 Fait !' : 'Fait !'}
          </Text>
        </TouchableOpacity>
      ) : (
        <Pill bg={cfg.bg} color={cfg.color}>{cfg.label}</Pill>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 13, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: C.sunSoft,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.sun,
  },
  hello: { fontSize: 19, fontWeight: '800', color: C.ink },
  levelTitle: { fontSize: 11, fontWeight: '700', color: C.sunText, marginTop: 2 },
  xpText: { fontSize: 11, color: C.inkSoft },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, alignItems: 'center', padding: 12 },
  statIcon: { fontSize: 22 },
  statVal: { fontSize: 18, fontWeight: '800', color: C.ink },
  statLabel: { fontSize: 11, color: C.inkSoft },
  section: { fontSize: 16, fontWeight: '800', color: C.ink, marginTop: 4 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  taskIcon: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: C.violetSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  taskTitle: { fontWeight: '700', fontSize: 14, color: C.ink },
  pillRow: { flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  doneBtn: { backgroundColor: C.mint, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
});
