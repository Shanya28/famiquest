# -*- coding: utf-8 -*-
"""
FamiQuest - Corrige le bouton "Refuser" (menu de raisons compatible Android)
  python3 patch_reject2.py   (depuis ~/Downloads/famiquest)
Remplace Alert.prompt (iOS seulement) par un menu de choix qui marche partout.
Reexecutable sans danger.
"""
import os, sys
if not os.path.exists('src/screens/parent/ValidationScreen.js'):
    sys.exit("ERREUR : lancez depuis ~/Downloads/famiquest")

p = 'src/screens/parent/ValidationScreen.js'
s = open(p).read()

if "Pourquoi refuser" in s:
    print("SKIP (deja applique)")
    sys.exit(0)

# Localiser le bloc askReject actuel (de 'const askReject' jusqu'a la ligne avant 'const approve')
start = s.find('  const askReject = (task) => {')
end = s.find('  const approve = async (task) => {')
if start == -1 or end == -1:
    sys.exit("INTROUVABLE : bloc askReject -> git checkout -- %s puis reappliquez patch_reject.py, puis celui-ci" % p)

new_block = '''  const askReject = (task) => {
    // Menu de raisons : fonctionne sur Android ET iPhone
    Alert.alert(
      'Pourquoi refuser ?',
      "La mission repassera « à refaire » chez l'enfant, avec la raison choisie.",
      [
        { text: '\\uD83D\\uDCF7 Photo floue / illisible', onPress: () => rejectTask(task, 'Photo floue ou illisible') },
        { text: '\\u2717 Tâche non terminée', onPress: () => rejectTask(task, "La tâche n'est pas terminée") },
        { text: 'Refuser sans raison', onPress: () => rejectTask(task, '') },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

'''

s = s[:start] + new_block + s[end:]
open(p, 'w').write(s)
print("OK : bouton Refuser corrige (menu de raisons Android-compatible)")
print("=== TERMINE ===")
