import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { C } from '../theme';
import { BADGES } from '../utils/gamification';

const { width } = Dimensions.get('window');
const CONFETTI = ['🎉', '⭐', '🎊', '✨', '🪙', '🎮', '🏅'];

function ConfettiPiece({ delay }) {
  const fall = useRef(new Animated.Value(-60)).current;
  const x = useRef(Math.random() * (width - 40)).current;
  const emoji = useRef(CONFETTI[Math.floor(Math.random() * CONFETTI.length)]).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fall, { toValue: 700, duration: 2200 + Math.random() * 800, delay, useNativeDriver: true }),
      Animated.loop(Animated.timing(rotate, { toValue: 1, duration: 900, useNativeDriver: true })),
    ]).start();
  }, []);

  return (
    <Animated.Text style={{
      position: 'absolute', left: x, fontSize: 22,
      transform: [
        { translateY: fall },
        { rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
      ],
    }}>{emoji}</Animated.Text>
  );
}

/** Écran de fête affiché quand l'enfant termine une mission */
export default function Celebration({ data, onClose }) {
  const scale = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (data) {
      scale.setValue(0.4);
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    }
  }, [data]);

  if (!data) return null;
  return (
    <Modal transparent animationType="fade">
      <View style={styles.bg}>
        {Array.from({ length: 18 }).map((_, i) => <ConfettiPiece key={i} delay={i * 90} />)}
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <Text style={{ fontSize: 54 }}>{data.levelUp ? '🚀' : '🎉'}</Text>
          <Text style={styles.title}>{data.levelUp ? 'NIVEAU SUPÉRIEUR !' : 'Mission accomplie !'}</Text>
          <View style={styles.rewards}>
            <Text style={styles.reward}>+{data.xp} XP</Text>
            <Text style={styles.reward}>+{data.coins} 🪙</Text>
            <Text style={styles.reward}>+{data.screenMin} min 🎮</Text>
          </View>
          {data.badges?.length > 0 && (
            <View style={styles.badgeBox}>
              <Text style={{ fontWeight: '800', color: C.sunText, fontSize: 12 }}>🏅 Nouveau badge !</Text>
              {data.badges.map((b) => (
                <Text key={b} style={{ color: C.ink, fontWeight: '700', marginTop: 2 }}>
                  {BADGES[b]?.icon} {BADGES[b]?.name}
                </Text>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Continuer 💪</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(43,38,83,.72)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 26, padding: 26, alignItems: 'center', width: '80%', gap: 10 },
  title: { fontSize: 20, fontWeight: '900', color: C.ink, textAlign: 'center' },
  rewards: { flexDirection: 'row', gap: 10 },
  reward: {
    backgroundColor: C.violetSoft, color: C.violetDark, fontWeight: '800', fontSize: 13,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, overflow: 'hidden',
  },
  badgeBox: { backgroundColor: C.sunSoft, borderRadius: 14, padding: 12, alignItems: 'center', width: '100%' },
  btn: { backgroundColor: C.violet, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 30, marginTop: 6 },
});
