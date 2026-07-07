import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch, Alert, DeviceEventEmitter,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { Card, Button } from '../../components/UI';
import PinModal from '../../components/PinModal';
import { C, TASK_ICONS } from '../../theme';

const REWARD_ICONS = ['🎁', '📱', '🎬', '🍰', '🌳', '🌙', '🍕', '🎡', '🧸', '⚽'];

export default function SettingsScreen() {
  const {
    family, children, rewards, setPin, setSetting, logout,
    addReward, deleteReward, removeChild,
  } = useApp();
  const [pinModal, setPinModal] = useState(false);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [rTitle, setRTitle] = useState('');
  const [rIcon, setRIcon] = useState('🎁');
  const [rCost, setRCost] = useState('30');

  const hasPin = !!family?.pin;

  const handlePin = () => {
    if (hasPin) {
      Alert.alert('Code parent', 'Que voulez-vous faire ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer le code', style: 'destructive', onPress: () => setPin(null) },
        { text: 'Changer le code', onPress: () => setPinModal(true) },
      ]);
    } else {
      setPinModal(true);
    }
  };

  const createReward = async () => {
    if (!rTitle.trim()) { Alert.alert('Oups', 'Donnez un nom à la récompense.'); return; }
    await addReward({ title: rTitle.trim(), icon: rIcon, cost: Number(rCost) || 10 });
    setRTitle(''); setShowRewardForm(false);
  };

  const confirmRemoveChild = (c) =>
    Alert.alert('Supprimer le profil ?', `Le profil de ${c.name}, ses tâches et rappels seront définitivement supprimés.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeChild(c.id) },
    ]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={styles.container}>
      {/* ---- Sécurité ---- */}
      <Text style={styles.section}>🔒 Sécurité</Text>
      <Card style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Code parent (PIN)</Text>
          <Text style={styles.rowSub}>
            {hasPin
              ? "Activé — l'Espace Parent est verrouillé sur cet appareil."
              : "Verrouille l'Espace Parent si l'enfant utilise le même appareil."}
          </Text>
        </View>
        <Button
          title={hasPin ? 'Gérer' : 'Activer'}
          bg={hasPin ? C.violetSoft : C.violet}
          color={hasPin ? C.violetDark : '#fff'}
          style={{ paddingHorizontal: 16 }}
          onPress={handlePin}
        />
      </Card>

      {/* ---- Aide ---- */}
      <Text style={styles.section}>🎓 Aide</Text>
      <Card style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Revoir le tutoriel</Text>
          <Text style={styles.rowSub}>
            Réaffiche le guide de démarrage de l'Espace Parent.
          </Text>
        </View>
        <Button
          title="Lancer" bg={C.violetSoft} color={C.violetDark}
          style={{ paddingHorizontal: 16 }}
          onPress={() => DeviceEventEmitter.emit('show_tutorial', 'parent')}
        />
      </Card>

      {/* ---- Boutique ---- */}
      <Text style={styles.section}>🛍️ Boutique de récompenses</Text>
      <Button
        title={showRewardForm ? 'Annuler' : '+ Ajouter une récompense'}
        bg={showRewardForm ? '#E4E2F0' : C.violet}
        color={showRewardForm ? C.inkSoft : '#fff'}
        onPress={() => setShowRewardForm((s) => !s)}
      />
      {showRewardForm && (
        <Card style={{ gap: 10 }}>
          <TextInput
            style={styles.input} placeholder="Ex. Soirée pizza en famille" placeholderTextColor={C.inkSoft}
            value={rTitle} onChangeText={setRTitle}
          />
          <View style={styles.rowWrap}>
            {REWARD_ICONS.map((ic) => (
              <TouchableOpacity key={ic} onPress={() => setRIcon(ic)}
                style={[styles.iconPick, rIcon === ic && styles.iconPicked]}>
                <Text style={{ fontSize: 20 }}>{ic}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontWeight: '700', color: C.inkSoft, fontSize: 13 }}>Prix 🪙</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]} keyboardType="number-pad"
              value={rCost} onChangeText={setRCost}
            />
          </View>
          <Button title="Ajouter à la boutique" bg={C.mint} onPress={createReward} />
        </Card>
      )}
      {rewards.map((r) => (
        <Card key={r.id} style={styles.rewardRow}>
          <Text style={{ fontSize: 22 }}>{r.icon}</Text>
          <Text style={{ flex: 1, fontWeight: '700', color: C.ink, fontSize: 13 }}>{r.title}</Text>
          <Text style={{ fontWeight: '800', color: C.sunText, fontSize: 13 }}>🪙 {r.cost}</Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => Alert.alert('Retirer ?', `« ${r.title} » sera retirée de la boutique.`, [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Retirer', style: 'destructive', onPress: () => deleteReward(r.id) },
            ])}
          >
            <Text style={{ color: C.coralText, fontWeight: '800' }}>✕</Text>
          </TouchableOpacity>
        </Card>
      ))}

      {/* ---- Profils enfants ---- */}
      <Text style={styles.section}>👨‍👩‍👧 Profils enfants</Text>
      {children.map((c) => (
        <Card key={c.id} style={styles.rewardRow}>
          <Text style={{ fontSize: 24 }}>{c.avatar}</Text>
          <Text style={{ flex: 1, fontWeight: '700', color: C.ink }}>{c.name}</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmRemoveChild(c)}>
            <Text style={{ color: C.coralText, fontWeight: '800' }}>✕</Text>
          </TouchableOpacity>
        </Card>
      ))}
      <Text style={styles.hint}>Pour ajouter un enfant : écran « Changer ⇄ » puis « + Ajouter un enfant ».</Text>

      {/* ---- Compte ---- */}
      <Button title="Se déconnecter du compte familial" bg={C.coralSoft} color={C.coralText} onPress={logout} />

      <PinModal
        visible={pinModal}
        expectedPin={null}
        title="Choisissez un code à 4 chiffres"
        onSuccess={(pin) => { setPin(pin); setPinModal(false); Alert.alert('🔒 Code activé', "L'Espace Parent est maintenant protégé."); }}
        onCancel={() => setPinModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { fontSize: 16, fontWeight: '800', color: C.ink, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontWeight: '800', color: C.ink, fontSize: 14 },
  rowSub: { fontSize: 12, color: C.inkSoft, marginTop: 2, lineHeight: 16 },
  input: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: C.violetSoft, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: C.ink,
  },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  iconPick: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  iconPicked: { backgroundColor: C.violetSoft, borderColor: C.violet },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  deleteBtn: { backgroundColor: C.coralSoft, borderRadius: 10, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 11, color: C.inkSoft, textAlign: 'center' },
});
