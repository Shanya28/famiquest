import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { C } from '../theme';

/**
 * Pavé numérique de saisie du code PIN parental.
 * Protège l'Espace Parent sur un appareil partagé avec l'enfant.
 */
export default function PinModal({ visible, expectedPin, title, onSuccess, onCancel }) {
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(false);

  const press = (d) => {
    const next = (entry + d).slice(0, 4);
    setEntry(next);
    setError(false);
    if (next.length === 4) {
      if (next === expectedPin) {
        setEntry('');
        onSuccess(next);
      } else if (expectedPin == null) {
        setEntry('');
        onSuccess(next); // mode "définir un nouveau PIN"
      } else {
        setError(true);
        setTimeout(() => setEntry(''), 350);
      }
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.bg}>
        <View style={styles.card}>
          <Text style={{ fontSize: 34 }}>🔒</Text>
          <Text style={styles.title}>{title || 'Code parent'}</Text>
          <View style={styles.dots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[
                styles.dot,
                entry.length > i && { backgroundColor: error ? C.coral : C.violet },
              ]} />
            ))}
          </View>
          {error && <Text style={styles.error}>Code incorrect</Text>}
          <View style={styles.pad}>
            {keys.map((k, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.key, !k && { backgroundColor: 'transparent' }]}
                disabled={!k}
                onPress={() => k === '⌫' ? setEntry(entry.slice(0, -1)) : press(k)}
              >
                <Text style={styles.keyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => { setEntry(''); onCancel(); }}>
            <Text style={{ color: C.inkSoft, fontWeight: '700', marginTop: 8 }}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(43,38,83,.72)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 26, padding: 24, alignItems: 'center', width: '82%' },
  title: { fontSize: 17, fontWeight: '800', color: C.ink, marginTop: 6 },
  dots: { flexDirection: 'row', gap: 12, marginVertical: 16 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.violetSoft },
  error: { color: C.coralText, fontWeight: '700', fontSize: 12, marginBottom: 6 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 220, justifyContent: 'center', gap: 10 },
  key: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  keyText: { fontSize: 22, fontWeight: '800', color: C.ink },
});
