import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Button } from '../components/UI';
import { levelOf } from '../utils/gamification';
import { C, AVATARS, shadow } from '../theme';

export default function ProfileSelectScreen() {
  const { children, setSession, addChild, logout } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [age, setAge] = useState('');

  const create = async () => {
    if (!name.trim()) { Alert.alert('Oups', "Indiquez le prénom de l'enfant."); return; }
    await addChild(name.trim(), avatar, age);
    setName(''); setAge(''); setShowAdd(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={styles.container}>
      <Text style={styles.logo}>🏡</Text>
      <Text style={styles.title}>Qui es-tu ?</Text>

      <TouchableOpacity style={styles.parentBtn} onPress={() => setSession({ mode: 'parent' })}>
        <Text style={{ fontSize: 30 }}>👨‍👩‍👧</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.parentTitle}>Espace Parent</Text>
          <Text style={styles.parentSub}>Tableau de bord, planning, validations</Text>
        </View>
      </TouchableOpacity>

      {children.map((c) => (
        <TouchableOpacity
          key={c.id}
          style={styles.childBtn}
          onPress={() => setSession({ mode: 'child', childId: c.id })}
        >
          <Text style={{ fontSize: 30 }}>{c.avatar}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.childName}>{c.name}</Text>
            <Text style={styles.childSub}>
              Niveau {levelOf(c.xp)} · 🔥 série de {c.streak || 0} jours
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
        <Text style={{ color: C.violetDark, fontWeight: '800' }}>+ Ajouter un enfant</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={logout} style={{ marginTop: 18 }}>
        <Text style={{ color: C.inkSoft, textAlign: 'center', fontSize: 12, fontWeight: '700' }}>
          Se déconnecter du compte familial
        </Text>
      </TouchableOpacity>

      {/* Modal d'ajout d'enfant */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nouvel enfant</Text>
            <TextInput
              style={styles.input} placeholder="Prénom" placeholderTextColor={C.inkSoft}
              value={name} onChangeText={setName}
            />
            <TextInput
              style={styles.input} placeholder="Âge (optionnel)" placeholderTextColor={C.inkSoft}
              keyboardType="number-pad" value={age} onChangeText={setAge}
            />
            <View style={styles.avatarRow}>
              {AVATARS.map((a) => (
                <TouchableOpacity
                  key={a}
                  onPress={() => setAvatar(a)}
                  style={[styles.avatarPick, avatar === a && styles.avatarPicked]}
                >
                  <Text style={{ fontSize: 24 }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Créer le profil" bg={C.mint} onPress={create} />
            <Button title="Annuler" bg={C.bg} color={C.inkSoft} onPress={() => setShowAdd(false)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 70, gap: 14 },
  logo: { fontSize: 48, textAlign: 'center' },
  title: {
    fontSize: 13, fontWeight: '800', color: C.inkSoft, textAlign: 'center',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
  },
  parentBtn: {
    backgroundColor: C.violet, borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, ...shadow,
  },
  parentTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  parentSub: { color: '#fff', opacity: 0.85, fontSize: 12 },
  childBtn: {
    backgroundColor: '#fff', borderRadius: 18, padding: 15, borderWidth: 2,
    borderColor: C.violetSoft, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  childName: { color: C.ink, fontWeight: '800', fontSize: 16 },
  childSub: { color: C.inkSoft, fontSize: 12 },
  addBtn: {
    borderStyle: 'dashed', borderWidth: 2, borderColor: C.violet, borderRadius: 18,
    padding: 15, alignItems: 'center',
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(43,38,83,.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  input: {
    backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: C.ink,
  },
  avatarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 4 },
  avatarPick: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  avatarPicked: { borderColor: C.violet, backgroundColor: C.violetSoft },
});
