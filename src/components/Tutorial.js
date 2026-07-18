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
  intro: [
    { icon: '🏡', title: "C'est quoi FamiQuest ?", text: "Une appli qui transforme les tâches quotidiennes de vos enfants (devoirs, rangement, lecture…) en jeu : chaque mission accomplie rapporte des points, des pièces et des minutes de jeu vidéo méritées." },
    { icon: '👨‍👩‍👧', title: 'Un seul compte pour toute la famille', text: "Sur cet écran, le parent crée LE compte familial avec son email et un mot de passe. Ensuite, chaque membre choisira son profil : Espace Parent pour vous, un profil par enfant." },
    { icon: '📱', title: 'Sur plusieurs téléphones', text: "Installez l'app sur le téléphone de chaque enfant et connectez-vous partout avec LE MÊME email et mot de passe. Le parent entre dans l'Espace Parent, l'enfant choisit son profil. Tout se synchronise tout seul." },
    { icon: '🔒', title: 'Un conseil avant de commencer', text: "Une fois dans l'app, allez dans Réglages pour activer un code PIN : il empêche les enfants d'entrer dans l'Espace Parent. Créez maintenant votre compte ! 🚀" },
  ],
  parent: [
    { icon: '👋', title: 'Bienvenue dans votre espace !', text: "Voici comment tout fonctionne, en 6 étapes concrètes. Vous pourrez revoir ce guide à tout moment dans Réglages → Revoir le tutoriel." },
    { icon: '👶', title: '1. Ajoutez vos enfants', text: "Appuyez sur « Changer ⇄ » en haut à droite : vous arrivez sur l'écran des profils. Appuyez sur « + Ajouter un enfant », choisissez son prénom et son avatar. Recommencez pour chaque enfant." },
    { icon: '📋', title: '2. Créez une mission', text: "Onglet « Tâches » en bas → bouton « + Nouvelle tâche ». Choisissez : l'enfant, les jours (aucun coché = tous les jours), l'heure du rappel, les récompenses. Activez « preuve photo » si vous voulez vérifier avec une photo." },
    { icon: '🔔', title: "3. Le téléphone de l'enfant sonne", text: "À l'heure choisie, une notification rappelle sa mission à l'enfant (acceptez les notifications à la première ouverture !). Non faite 30 minutes après l'heure, la mission passe « En retard » en rouge." },
    { icon: '✅', title: '4. Validez son travail', text: "Onglet « Valider » : les photos envoyées par vos enfants y apparaissent avec un badge rouge. « Valider » envoie les récompenses, « Refuser » remet la mission à faire. Les achats en boutique se confirment ici aussi." },
    { icon: '🎮', title: '5. Le jeu vidéo se mérite', text: "Chaque mission validée ajoute des minutes de jeu au compteur de l'enfant. Dans l'onglet Valider, les boutons − et + vous permettent d'ajuster ce temps à tout moment. Vous gardez le dernier mot." },
    { icon: '📊', title: '6. Suivez et personnalisez', text: "L'onglet « Tableau » montre les progrès et le graphique de la semaine. Dans « Réglages » : code PIN, récompenses de la boutique, profils. Bonne aventure en famille ! 🚀" },
  ],
  child: [
    { icon: '🎉', title: 'Bienvenue, héros !', text: "Ici, tes tâches deviennent des missions de jeu ! Voici comment jouer, en 4 étapes rapides." },
    { icon: '🏠', title: 'Tes missions du jour', text: "Elles sont sur ton écran d'accueil, chacune avec son heure. Ton téléphone sonnera pour te les rappeler ! Quand tu as fini, appuie sur le bouton vert « Fait ! » — la mission devient verte ✓." },
    { icon: '📸', title: 'La preuve photo', text: "Si le bouton dit « 📸 Fait ! », prends en photo ton travail (ton lit fait, ta chambre rangée…). Papa ou maman regarde ta photo et t'envoie tes récompenses. Pas de triche ! 😄" },
    { icon: '⭐', title: 'Gagne des trésors', text: "Chaque mission te donne : des XP pour monter de niveau, des pièces 🪙 et des minutes de jeu vidéo 🎮. Fais au moins une mission chaque jour pour faire grandir ta série 🔥 !" },
    { icon: '🛍', title: 'Dépense tes pièces', text: "Dans la Boutique, achète de vraies récompenses (dessert, film, sortie…) que tes parents te remettent. Et regarde tes badges dans Trophées 🏅. À toi de jouer !" },
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
