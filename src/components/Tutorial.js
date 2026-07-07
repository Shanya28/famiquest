import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, DeviceEventEmitter,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../theme';

/**
 * Tutoriel de bienvenue affiche au premier contact avec chaque espace.
 * - S'affiche une seule fois par appareil (memorise via AsyncStorage)
 * - Peut etre rejoue depuis les Reglages (evenement 'show_tutorial')
 */
const SLIDES = {
  parent: [
    { icon: '👋', title: 'Bienvenue sur FamiQuest !', text: "Transformez les responsabilités quotidiennes de vos enfants en jeu motivant. Ce petit guide vous montre l'essentiel en 1 minute." },
    { icon: '📋', title: 'Créez les missions', text: "Dans l'onglet Tâches : choisissez l'enfant, les jours de la semaine, l'heure du rappel, les récompenses (XP, pièces, minutes de jeu) et exigez une preuve photo si besoin. L'enfant reçoit une notification à l'heure dite." },
    { icon: '✅', title: 'Validez leurs preuves', text: "Quand un enfant termine une mission avec photo, elle apparaît dans l'onglet Valider. Approuvez pour envoyer les récompenses, ou refusez pour qu'il recommence. Les achats en boutique se confirment ici aussi." },
    { icon: '🎮', title: 'Le jeu se mérite', text: "Chaque mission accomplie fait gagner des minutes de jeu vidéo, visibles dans un compteur. Vous gardez le contrôle : ajoutez ou retirez du temps à tout moment dans l'onglet Valider." },
    { icon: '📊', title: 'Suivez leurs progrès', text: "Le Tableau montre les missions du jour, les retards et un graphique des 7 derniers jours pour chaque enfant. Les séries 🔥 récompensent la régularité." },
    { icon: '⚙️', title: 'Personnalisez tout', text: "Dans Réglages : activez un code PIN pour verrouiller votre espace, gérez la boutique de récompenses et les profils. Bonne aventure en famille ! 🚀" },
  ],
  child: [
    { icon: '🎉', title: 'Bienvenue, héros !', text: "Ici, tes tâches deviennent des missions ! Ce petit guide t'explique tout en 30 secondes." },
    { icon: '🏠', title: 'Tes missions du jour', text: "Elles t'attendent sur l'écran d'accueil avec leur heure. Quand tu en termines une, appuie sur « Fait ! ». Parfois il faudra envoyer une photo en preuve 📸 — tes parents vérifient !" },
    { icon: '⭐', title: 'Gagne des récompenses', text: "Chaque mission te rapporte des XP pour monter de niveau, des pièces 🪙 et des minutes de jeu vidéo 🎮. Fais des missions tous les jours pour garder ta série 🔥 !" },
    { icon: '🛍️', title: 'Dépense tes pièces', text: "Dans la Boutique, achète des vraies récompenses : dessert préféré, film du soir, sortie au parc… Tes parents te les remettent. Et dans Trophées, découvre tes badges à débloquer 🏅. À toi de jouer !" },
  ],
};

export default function Tutorial({ mode }) {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const slides = SLIDES[mode] || SLIDES.parent;
  const storageKey = `famiquest_tuto_${mode}`;

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((v) => { if (!v) setVisible(true); })
      .catch(() => setVisible(true));
    const sub = DeviceEventEmitter.addListener('show_tutorial', (m) => {
      if (m === mode) { setIndex(0); setVisible(true); }
    });
    return () => sub.remove();
  }, []);

  const close = () => {
    setVisible(false);
    setIndex(0);
    AsyncStorage.setItem(storageKey, 'done').catch(() => {});
  };

  if (!visible) return null;
  const slide = slides[index];
  const last = index === slides.length - 1;

  return (
    <Modal transparent animationType="fade">
      <View style={styles.bg}>
        <View style={styles.card}>
          <Text style={styles.icon}>{slide.icon}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.text}>{slide.text}</Text>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => (last ? close() : setIndex(index + 1))}
          >
            <Text style={styles.nextText}>
              {last ? (mode === 'child' ? "C'est parti ! 🚀" : 'Commencer 🚀') : 'Suivant →'}
            </Text>
          </TouchableOpacity>
          {!last && (
            <TouchableOpacity onPress={close}>
              <Text style={styles.skip}>Passer le tutoriel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(43,38,83,.78)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 26, padding: 26, alignItems: 'center', width: '100%', maxWidth: 400 },
  icon: { fontSize: 56 },
  title: { fontSize: 20, fontWeight: '900', color: C.ink, textAlign: 'center', marginTop: 10 },
  text: { fontSize: 14, color: C.inkSoft, textAlign: 'center', lineHeight: 21, marginTop: 10, minHeight: 105 },
  dots: { flexDirection: 'row', gap: 7, marginVertical: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.violetSoft },
  dotActive: { backgroundColor: C.violet, width: 22 },
  nextBtn: { backgroundColor: C.violet, borderRadius: 14, paddingVertical: 13, alignItems: 'center', width: '100%' },
  nextText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  skip: { color: C.inkSoft, fontWeight: '700', fontSize: 12, marginTop: 12 },
});
