import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Button } from '../components/UI';
import { C } from '../theme';

export default function AuthScreen() {
  const { login, signup } = useApp();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Oups', 'Email requis et mot de passe de 6 caractères minimum.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else await signup(email.trim(), password);
    } catch (e) {
      const msg = {
        'auth/invalid-credential': 'Email ou mot de passe incorrect.',
        'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
        'auth/invalid-email': 'Adresse email invalide.',
      }[e.code] || 'Connexion impossible. Vérifiez votre réseau et la configuration Firebase.';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>🏡</Text>
      <Text style={styles.title}>
        Fami<Text style={{ color: C.violet }}>Quest</Text>
      </Text>
      <Text style={styles.subtitle}>Les bonnes habitudes deviennent un jeu.</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email du parent"
          placeholderTextColor={C.inkSoft}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={C.inkSoft}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {loading ? (
          <ActivityIndicator color={C.violet} style={{ marginVertical: 12 }} />
        ) : (
          <Button
            title={mode === 'login' ? 'Se connecter' : 'Créer le compte familial'}
            onPress={submit}
          />
        )}
        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={styles.switch}>
            {mode === 'login'
              ? "Pas encore de compte ? Créer un compte familial"
              : 'Déjà un compte ? Se connecter'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', padding: 28 },
  logo: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 34, fontWeight: '800', color: C.ink, textAlign: 'center', marginTop: 6 },
  subtitle: { fontSize: 14, color: C.inkSoft, textAlign: 'center', marginTop: 4, marginBottom: 26 },
  form: { gap: 12 },
  input: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: C.violetSoft, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.ink,
  },
  switch: { color: C.violetDark, fontWeight: '700', textAlign: 'center', marginTop: 10, fontSize: 13 },
});
