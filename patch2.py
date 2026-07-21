# -*- coding: utf-8 -*-
"""
FamiQuest - Correctif camera v3 (Tecno / HiOS friendly)
  python3 patch2.py   (depuis ~/Downloads/famiquest)
- Le bouton preuve propose Caméra OU Galerie (repli fiable sur Tecno)
- Plus aucun echec silencieux : toute erreur est affichee
- Permission refusee -> propose d'ouvrir les reglages
Reexecutable sans danger.
"""
import os, sys
if not os.path.exists('src/screens/child/MissionsScreen.js'):
    sys.exit("ERREUR : lancez ce script depuis ~/Downloads/famiquest")

p = 'src/screens/child/MissionsScreen.js'
s = open(p).read()

if 'chooseAndSubmit' in s:
    print('SKIP  (correctif camera v3 deja applique)')
    sys.exit(0)

# 1) Imports : ajouter Linking (ouvrir les reglages) si absent
if 'Linking' not in s.split('from \'react-native\'')[0]:
    s = s.replace(
        "  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,",
        "  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking,")

# 2) Remplacer tout le corps de handleComplete
old = """  const handleComplete = async (task) => {
    if (!task.proofRequired) {
      await completeTask(task); // la célébration s'affiche via le contexte
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Caméra requise', "Autorise l'appareil photo pour envoyer ta preuve.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7, allowsEditing: true, aspect: [4, 3],
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    try {
      setBusy(task.id);
      // Reduction de la photo (largeur 700px, compressee) pour rester sous 1 Mo
      const small = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 700 } }],
        { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      await submitProof(task, `data:image/jpeg;base64,${small.base64}`);
      Alert.alert('📤 Envoyé !', 'Tes parents vont vérifier ta mission 👀');
    } catch (e) {
      Alert.alert('Erreur', "L'envoi de la photo a échoué. Vérifie ta connexion et réessaie.");
    } finally {
      setBusy(null);
    }
  };"""

new = """  // Envoie la photo choisie (camera ou galerie) : compression + upload
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
  };"""

assert old in s, 'bloc handleComplete introuvable (structure differente)'
s = s.replace(old, new)
open(p, 'w').write(s)
print('OK    correctif camera v3 applique')
print('=== TERMINE ===')
