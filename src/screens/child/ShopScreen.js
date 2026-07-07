import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Card, Pill } from '../../components/UI';
import { C } from '../../theme';

/** Boutique : l'enfant dépense ses pièces, le parent valide la remise de la récompense */
export default function ShopScreen() {
  const { session, children, rewards, redemptions, buyReward } = useApp();
  const child = children.find((c) => c.id === session.childId);
  if (!child) return null;

  const myRedemptions = redemptions
    .filter((r) => r.childId === child.id)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 10);

  const buy = (reward) => {
    if ((child.coins || 0) < reward.cost) {
      Alert.alert('🪙 Pas assez de pièces', `Il te manque ${reward.cost - (child.coins || 0)} pièces. Termine des missions pour en gagner !`);
      return;
    }
    Alert.alert(`${reward.icon} ${reward.title}`, `Acheter pour ${reward.cost} pièces ? Tes parents devront confirmer la remise.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Acheter !',
        onPress: async () => {
          await buyReward(child, reward);
          Alert.alert('🛍️ Achat envoyé !', 'Tes parents ont reçu ta demande. Récompense en route ! 🚀');
        },
      },
    ]);
  };

  const statusCfg = {
    pending: { label: 'En attente 👀', bg: C.sunSoft, color: C.sunText },
    approved: { label: 'Reçu ! 🎉', bg: C.mintSoft, color: C.mintText },
    rejected: { label: 'Remboursé ↩️', bg: C.coralSoft, color: C.coralText },
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={styles.container}>
      <Card style={styles.wallet}>
        <Text style={{ fontSize: 30 }}>🪙</Text>
        <View>
          <Text style={styles.walletVal}>{child.coins || 0} pièces</Text>
          <Text style={styles.walletLabel}>Ta cagnotte — chaque mission t'en rapporte !</Text>
        </View>
      </Card>

      <Text style={styles.section}>La boutique</Text>
      {rewards.length === 0 && (
        <Card style={{ alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 30 }}>🛍️</Text>
          <Text style={{ fontWeight: '800', color: C.ink, marginTop: 4 }}>Boutique vide</Text>
          <Text style={{ fontSize: 12, color: C.inkSoft, textAlign: 'center' }}>
            Tes parents peuvent ajouter des récompenses dans leurs réglages.
          </Text>
        </Card>
      )}
      <View style={styles.grid}>
        {rewards.map((r) => {
          const affordable = (child.coins || 0) >= r.cost;
          return (
            <Card key={r.id} style={[styles.item, !affordable && { opacity: 0.55 }]}>
              <Text style={{ fontSize: 32 }}>{r.icon}</Text>
              <Text style={styles.itemTitle}>{r.title}</Text>
              <TouchableOpacity
                style={[styles.buyBtn, { backgroundColor: affordable ? C.sun : '#E4E2F0' }]}
                onPress={() => buy(r)}
              >
                <Text style={{ fontWeight: '800', fontSize: 12, color: affordable ? '#5C3A00' : '#A6A3C2' }}>
                  🪙 {r.cost}
                </Text>
              </TouchableOpacity>
            </Card>
          );
        })}
      </View>

      {myRedemptions.length > 0 && (
        <>
          <Text style={styles.section}>Mes achats</Text>
          {myRedemptions.map((r) => {
            const cfg = statusCfg[r.status] || statusCfg.pending;
            return (
              <Card key={r.id} style={styles.redRow}>
                <Text style={{ fontSize: 22 }}>{r.rewardIcon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: C.ink, fontSize: 13 }}>{r.rewardTitle}</Text>
                  <Text style={{ fontSize: 11, color: C.inkSoft }}>🪙 {r.cost} pièces</Text>
                </View>
                <Pill bg={cfg.bg} color={cfg.color}>{cfg.label}</Pill>
              </Card>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 30 },
  wallet: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.sunSoft },
  walletVal: { fontSize: 22, fontWeight: '900', color: C.ink },
  walletLabel: { fontSize: 11, color: C.sunText, fontWeight: '600' },
  section: { fontSize: 16, fontWeight: '800', color: C.ink, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: { width: '47.8%', alignItems: 'center', padding: 14, gap: 8 },
  itemTitle: { fontWeight: '700', fontSize: 12.5, color: C.ink, textAlign: 'center', minHeight: 32 },
  buyBtn: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  redRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
});
