import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch, Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { Card, Button } from '../../components/UI';
import { DAY_NAMES } from '../../utils/gamification';
import { C, TASK_ICONS } from '../../theme';

// Ordre d'affichage lundi → dimanche (valeurs = getDay JS)
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function TasksScreen() {
  const { children, tasks, addTask, deleteTask } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', childId: null, time: '17:00', icon: '📝',
    xp: '20', coins: '5', screenMin: '10', proofRequired: false,
    days: [], // vide = tous les jours
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDay = (d) =>
    set('days', form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d]);

  const submit = async () => {
    const childId = form.childId || children[0]?.id;
    if (!childId) { Alert.alert('Oups', "Ajoutez d'abord un enfant depuis l'écran de profils."); return; }
    if (!form.title.trim()) { Alert.alert('Oups', 'Donnez un intitulé à la tâche.'); return; }
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(form.time)) {
      Alert.alert('Oups', "L'heure doit être au format HH:MM (ex. 17:30).");
      return;
    }
    await addTask({
      title: form.title.trim(), childId, time: form.time, icon: form.icon,
      xp: Number(form.xp) || 0, coins: Number(form.coins) || 0,
      screenMin: Number(form.screenMin) || 0, proofRequired: form.proofRequired,
      days: form.days,
    });
    set('title', '');
    setShowForm(false);
    const when = form.days.length === 0 || form.days.length === 7
      ? 'tous les jours'
      : WEEK_ORDER.filter((d) => form.days.includes(d)).map((d) => DAY_NAMES[d]).join(', ');
    Alert.alert('📋 Tâche créée', `Rappel programmé ${when} à ${form.time}.`);
  };

  const remove = (task) =>
    Alert.alert('Supprimer ?', `« ${task.title} » et ses rappels seront supprimés.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteTask(task) },
    ]);

  const daysLabel = (t) =>
    !t.days || t.days.length === 0 || t.days.length === 7
      ? 'Tous les jours'
      : WEEK_ORDER.filter((d) => t.days.includes(d)).map((d) => DAY_NAMES[d]).join(' ');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={styles.container}>
      <Button
        title={showForm ? 'Annuler' : '+ Nouvelle tâche'}
        bg={showForm ? '#E4E2F0' : C.violet}
        color={showForm ? C.inkSoft : '#fff'}
        onPress={() => setShowForm((s) => !s)}
      />

      {showForm && (
        <Card style={{ gap: 10 }}>
          <Field label="Intitulé de la tâche">
            <TextInput style={styles.input} placeholder="Ex. Arroser les plantes" placeholderTextColor={C.inkSoft}
              value={form.title} onChangeText={(v) => set('title', v)} />
          </Field>

          <Field label="Enfant">
            <View style={styles.rowWrap}>
              {children.map((c) => {
                const active = (form.childId || children[0]?.id) === c.id;
                return (
                  <TouchableOpacity key={c.id} onPress={() => set('childId', c.id)}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text style={{ fontWeight: '700', color: active ? C.violetDark : C.inkSoft }}>
                      {c.avatar} {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          <Field label="Jours de la semaine (aucun sélectionné = tous les jours)">
            <View style={styles.rowWrap}>
              {WEEK_ORDER.map((d) => {
                const active = form.days.includes(d);
                return (
                  <TouchableOpacity key={d} onPress={() => toggleDay(d)}
                    style={[styles.dayChip, active && styles.chipActive]}>
                    <Text style={{ fontWeight: '800', fontSize: 12, color: active ? C.violetDark : C.inkSoft }}>
                      {DAY_NAMES[d]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          <Field label="Heure du rappel (HH:MM)">
            <TextInput style={styles.input} placeholder="17:30" placeholderTextColor={C.inkSoft}
              value={form.time} onChangeText={(v) => set('time', v)} keyboardType="numbers-and-punctuation" />
          </Field>

          <Field label="Icône">
            <View style={styles.rowWrap}>
              {TASK_ICONS.map((ic) => (
                <TouchableOpacity key={ic} onPress={() => set('icon', ic)}
                  style={[styles.iconPick, form.icon === ic && styles.iconPicked]}>
                  <Text style={{ fontSize: 20 }}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field label="XP" style={{ flex: 1 }}>
              <TextInput style={styles.input} keyboardType="number-pad" value={form.xp} onChangeText={(v) => set('xp', v)} />
            </Field>
            <Field label="Pièces" style={{ flex: 1 }}>
              <TextInput style={styles.input} keyboardType="number-pad" value={form.coins} onChangeText={(v) => set('coins', v)} />
            </Field>
            <Field label="Min. de jeu" style={{ flex: 1 }}>
              <TextInput style={styles.input} keyboardType="number-pad" value={form.screenMin} onChangeText={(v) => set('screenMin', v)} />
            </Field>
          </View>

          <View style={styles.switchRow}>
            <Text style={{ fontWeight: '700', color: C.ink, fontSize: 13, flex: 1 }}>Exiger une preuve photo</Text>
            <Switch value={form.proofRequired} onValueChange={(v) => set('proofRequired', v)}
              trackColor={{ true: C.violet, false: '#E4E2F0' }} thumbColor="#fff" />
          </View>

          <Button title="Créer la tâche" bg={C.mint} onPress={submit} />
        </Card>
      )}

      {children.map((child) => (
        <View key={child.id} style={{ gap: 8 }}>
          <Text style={styles.section}>{child.avatar} Planning de {child.name}</Text>
          {tasks.filter((t) => t.childId === child.id).map((t) => (
            <Card key={t.id} style={styles.taskRow}>
              {t.status === 'done'
                ? <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '900' }}>{'\u2713'}</Text>
                  </View>
                : <Text style={{ fontSize: 20 }}>{t.icon}</Text>}
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle}>{t.title}</Text>
                <Text style={styles.taskMeta}>
                  🕐 {t.time} · {daysLabel(t)}{'\n'}
                  +{t.xp} XP · 🪙 {t.coins} · 🎮 {t.screenMin} min{t.proofRequired ? ' · 📸 preuve' : ''}
                </Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => remove(t)}>
                <Text style={{ color: C.coralText, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const Field = ({ label, children, style }) => (
  <View style={style}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 30 },
  label: { fontSize: 12, fontWeight: '700', color: C.inkSoft, marginBottom: 4 },
  input: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: C.violetSoft, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: C.ink,
  },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: C.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: 'transparent' },
  dayChip: { backgroundColor: C.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 2, borderColor: 'transparent' },
  chipActive: { backgroundColor: C.violetSoft, borderColor: C.violet },
  iconPick: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  iconPicked: { backgroundColor: C.violetSoft, borderColor: C.violet },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  section: { fontWeight: '800', color: C.ink, fontSize: 15, marginTop: 4 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  taskTitle: { fontWeight: '700', fontSize: 13, color: C.ink },
  taskMeta: { fontSize: 11, color: C.inkSoft, lineHeight: 16 },
  deleteBtn: { backgroundColor: C.coralSoft, borderRadius: 10, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
