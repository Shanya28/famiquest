# -*- coding: utf-8 -*-
"""
FamiQuest - Notifier l'enfant quand le parent refuse une preuve
  python3 patch_reject.py   (depuis ~/Downloads/famiquest)
- Le refus met la tache en statut 'rejected' (au lieu de 'todo' silencieux)
- L'enfant voit un bandeau rouge "A refaire" + peut la refaire
- Le parent peut saisir une raison optionnelle, affichee a l'enfant
Reexecutable sans danger.
"""
import os, sys
if not os.path.exists('src/context/AppContext.js'):
    sys.exit("ERREUR : lancez depuis ~/Downloads/famiquest")

def repl(path, old, new, marker, label):
    s = open(path).read()
    if marker in s:
        print('SKIP  %s %s' % (path, label)); return
    if old not in s:
        sys.exit('INTROUVABLE %s %s -> git checkout -- %s puis relancez' % (path, label, path))
    open(path, 'w').write(s.replace(old, new, 1))
    print('OK    %s %s' % (path, label))

# 1) AppContext : rejectTask stocke le statut 'rejected' + une raison
repl('src/context/AppContext.js',
  """  const rejectTask = (task) =>
    updateDoc(doc(db, 'families', familyId, 'tasks', task.id),
      { status: 'todo', proofUrl: null });""",
  """  const rejectTask = (task, reason = '') =>
    updateDoc(doc(db, 'families', familyId, 'tasks', task.id),
      { status: 'rejected', proofUrl: null, rejectReason: reason });""",
  marker="status: 'rejected'", label='[rejectTask]')

# 2) effectiveStatus : une tache 'rejected' reste refaisable (comme todo, sans passer late)
repl('src/utils/gamification.js',
  """export function effectiveStatus(task) {
  if (task.status !== 'todo') return task.status;""",
  """export function effectiveStatus(task) {
  if (task.status === 'rejected') return 'rejected';
  if (task.status !== 'todo') return task.status;""",
  marker="=== 'rejected'", label='[effectiveStatus]')

# 3) MissionsScreen : statut visuel 'rejected' + rendre actionnable + bandeau raison
repl('src/screens/child/MissionsScreen.js',
  """    pending: { label: 'En attente 👀', bg: C.sunSoft, color: C.sunText },
    done: { label: 'Terminé ✓', bg: C.mintSoft, color: C.mintText },
  }[task.status] || { label: task.status, bg: C.bg, color: C.inkSoft };
  const actionable = task.status === 'todo' || task.status === 'late';""",
  """    pending: { label: 'En attente 👀', bg: C.sunSoft, color: C.sunText },
    rejected: { label: '❌ À refaire', bg: C.coralSoft, color: C.coralText },
    done: { label: 'Terminé ✓', bg: C.mintSoft, color: C.mintText },
  }[task.status] || { label: task.status, bg: C.bg, color: C.inkSoft };
  const actionable = task.status === 'todo' || task.status === 'late' || task.status === 'rejected';""",
  marker="rejected: { label: '❌ À refaire'", label='[MissionsScreen cfg]')

# 3b) Bandeau explicatif rouge sous une tache refusee
repl('src/screens/child/MissionsScreen.js',
  """      {busy ? (
        <ActivityIndicator color={C.violet} />""",
  """      {task.status === 'rejected' && (
        <View style={styles.rejectBanner}>
          <Text style={styles.rejectText}>
            {'\\u274C'} Ta preuve n'a pas été validée. {task.rejectReason ? '\\u00AB ' + task.rejectReason + ' \\u00BB. ' : ''}Refais ta mission !
          </Text>
        </View>
      )}
      {busy ? (
        <ActivityIndicator color={C.violet} />""",
  marker="rejectBanner", label='[MissionsScreen bandeau]')

# 3c) Style du bandeau
repl('src/screens/child/MissionsScreen.js',
  "  doneBtn: { backgroundColor: C.mint, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },",
  """  doneBtn: { backgroundColor: C.mint, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  rejectBanner: { position: 'absolute', bottom: -6, left: 58, right: 12, backgroundColor: 'transparent' },
  rejectText: { color: C.coralText, fontSize: 11, fontWeight: '700' },""",
  marker="rejectBanner:", label='[MissionsScreen style]')

# 4) ValidationScreen : bouton Refuser demande une raison optionnelle
repl('src/screens/parent/ValidationScreen.js',
  """              <Button title="✕ Refuser" bg={C.coralSoft} color={C.coralText} style={{ flex: 1 }} onPress={() => rejectTask(t)} />""",
  """              <Button title="✕ Refuser" bg={C.coralSoft} color={C.coralText} style={{ flex: 1 }} onPress={() => askReject(t)} />""",
  marker="askReject(t)", label='[ValidationScreen bouton]')

# 4b) Fonction askReject (avec saisie de raison quand dispo, sinon simple refus)
repl('src/screens/parent/ValidationScreen.js',
  """  const approve = async (task) => {""",
  """  const askReject = (task) => {
    // Alert.prompt n'existe que sur iOS : sur Android on refuse avec une raison generique
    if (Alert.prompt) {
      Alert.prompt(
        'Refuser la preuve',
        \"Explique a l'enfant pourquoi (optionnel) :\",
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Refuser', style: 'destructive', onPress: (reason) => rejectTask(task, reason || '') },
        ],
        'plain-text'
      );
    } else {
      Alert.alert('Refuser la preuve ?', \"La mission repassera 'a refaire' cote enfant.\", [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Refuser', style: 'destructive', onPress: () => rejectTask(task, '') },
      ]);
    }
  };

  const approve = async (task) => {""",
  marker="const askReject", label='[ValidationScreen fonction]')

print('')
print('=== TERMINE ===')
