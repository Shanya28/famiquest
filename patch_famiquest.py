# -*- coding: utf-8 -*-
"""
FamiQuest - Correctifs v2 (a executer depuis ~/Downloads/famiquest)
  python3 patch_famiquest.py
Reexecutable sans danger : chaque bloc detecte s'il est deja applique.
Corrige : notifications Android, sync des rappels sur chaque appareil,
photo compressee (envoi fonctionnel), coches vertes, tutoriels explicites
+ tutoriel d'accueil a l'inscription.
"""
import os, sys

if not os.path.exists('src/context/AppContext.js'):
    sys.exit("ERREUR : lancez ce script depuis le dossier famiquest (cd ~/Downloads/famiquest)")

def apply(path, old, new, once_marker=None, label=''):
    s = open(path).read()
    if (once_marker and once_marker in s) or new in s:
        print('SKIP  %s %s (deja applique)' % (path, label))
        return
    if old not in s:
        sys.exit('INTROUVABLE dans %s %s -> restaurez avec: git checkout -- %s puis relancez' % (path, label, path))
    open(path, 'w').write(s.replace(old, new, 1))
    print('OK    %s %s' % (path, label))

# ---------- 1) notifications.js ----------
p = 'src/services/notifications.js'
s = open(p).read()
if 'syncAllReminders' in s:
    print('SKIP  %s (deja applique)' % p)
else:
    a = "trigger: { type: 'calendar', hour, minute, repeats: true },"
    b = "trigger: { type: 'daily', hour, minute },"
    c = "trigger: { type: 'calendar', weekday: jsDay + 1, hour, minute, repeats: true },"
    d = "trigger: { type: 'weekly', weekday: jsDay + 1, hour, minute },"
    if a not in s or c not in s:
        sys.exit('INTROUVABLE: triggers dans %s -> git checkout -- %s puis relancez' % (p, p))
    s = s.replace(a, b).replace(c, d)
    s += """

/**
 * Synchronise TOUS les rappels sur CET appareil a partir de la liste des taches.
 * Chaque telephone connecte (parent et enfants) a ainsi ses rappels a jour,
 * quel que soit l'appareil qui a cree la tache.
 */
export async function syncAllReminders(tasks) {
  if (Platform.OS === 'web') return;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (perm.status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      if (req.status !== 'granted') return;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const t of tasks) {
      try { await scheduleReminders(t); } catch (e) { /* tache invalide : ignoree */ }
    }
  } catch (e) { /* rappels indisponibles : sans consequence */ }
}
"""
    open(p, 'w').write(s)
    print('OK    %s' % p)

# ---------- 2) AppContext.js ----------
apply('src/context/AppContext.js',
  "import { scheduleReminders, cancelReminders, registerForPushNotifications } from '../services/notifications';",
  "import { syncAllReminders, registerForPushNotifications } from '../services/notifications';",
  once_marker='syncAllReminders', label='[imports]')

apply('src/context/AppContext.js',
  """    for (const t of tasks.filter((x) => x.childId === childId)) {
      await cancelReminders(t.notificationIds || t.notificationId);
      await deleteDoc(doc(db, 'families', familyId, 'tasks', t.id));
    }""",
  """    for (const t of tasks.filter((x) => x.childId === childId)) {
      await deleteDoc(doc(db, 'families', familyId, 'tasks', t.id));
    }""",
  once_marker=None, label='[removeChild]')

old_addtask = """  const addTask = async (task) => {
    let notificationIds = [];
    try {
      notificationIds = await scheduleReminders(task);
    } catch (e) {
      // Rappels indisponibles (web, permissions refusees...) : la tache se cree sans rappel
    }
    return addDoc(collection(db, 'families', familyId, 'tasks'), {
      ...task, status: 'todo', day: todayKey(), notificationIds,
      createdAt: serverTimestamp(),
    });
  };

  const deleteTask = async (task) => {
    await cancelReminders(task.notificationIds || task.notificationId);
    return deleteDoc(doc(db, 'families', familyId, 'tasks', task.id));
  };"""
new_addtask = """  const addTask = (task) =>
    addDoc(collection(db, 'families', familyId, 'tasks'), {
      ...task, status: 'todo', day: todayKey(),
      createdAt: serverTimestamp(),
    });

  const deleteTask = (task) =>
    deleteDoc(doc(db, 'families', familyId, 'tasks', task.id));

  /* ---------- Rappels locaux : resynchronises sur CHAQUE appareil connecte ---------- */
  useEffect(() => {
    syncAllReminders(tasks);
  }, [JSON.stringify(tasks.map((t) => ({ i: t.id, h: t.time, d: t.days, n: t.title })))]);"""

s = open('src/context/AppContext.js').read()
if 'syncAllReminders(tasks);' in s:
    print('SKIP  src/context/AppContext.js [addTask/sync] (deja applique)')
else:
    apply('src/context/AppContext.js', old_addtask, new_addtask, label='[addTask/sync]')

# ---------- 3) MissionsScreen.js : photo compressee ----------
apply('src/screens/child/MissionsScreen.js',
  "import * as ImagePicker from 'expo-image-picker';",
  "import * as ImagePicker from 'expo-image-picker';\nimport * as ImageManipulator from 'expo-image-manipulator';",
  once_marker='ImageManipulator', label='[import manipulator]')

old_cam = """    const result = await ImagePicker.launchCameraAsync({
      quality: 0.2, allowsEditing: true, aspect: [4, 3], base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;
    try {
      setBusy(task.id);
      await submitProof(task, `data:image/jpeg;base64,${result.assets[0].base64}`);"""
new_cam = """    const result = await ImagePicker.launchCameraAsync({
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
      await submitProof(task, `data:image/jpeg;base64,${small.base64}`);"""
s = open('src/screens/child/MissionsScreen.js').read()
if 'manipulateAsync' in s:
    print('SKIP  src/screens/child/MissionsScreen.js [camera] (deja applique)')
else:
    apply('src/screens/child/MissionsScreen.js', old_cam, new_cam, label='[camera]')

# ---------- 4) Coche verte enfant ----------
apply('src/screens/child/MissionsScreen.js',
  "      <View style={styles.taskIcon}><Text style={{ fontSize: 24 }}>{task.icon}</Text></View>",
  """      <View style={[styles.taskIcon, task.status === 'done' && { backgroundColor: C.mint }]}>
        {task.status === 'done'
          ? <Text style={{ fontSize: 22, color: '#fff', fontWeight: '900' }}>{'\\u2713'}</Text>
          : <Text style={{ fontSize: 24 }}>{task.icon}</Text>}
      </View>""",
  once_marker="task.status === 'done' && { backgroundColor: C.mint }", label='[coche verte]')

# ---------- 5) Coche verte parent ----------
apply('src/screens/parent/TasksScreen.js',
  "              <Text style={{ fontSize: 20 }}>{t.icon}</Text>",
  """              {t.status === 'done'
                ? <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '900' }}>{'\\u2713'}</Text>
                  </View>
                : <Text style={{ fontSize: 20 }}>{t.icon}</Text>}""",
  once_marker="t.status === 'done'", label='[coche verte]')

# ---------- 6) Tutorial.js : slides explicites + intro ----------
p = 'src/components/Tutorial.js'
s = open(p).read()
if 'intro:' in s:
    print('SKIP  %s (deja applique)' % p)
else:
    start = s.find('const SLIDES = {')
    end = s.find('\n};', start)
    if start == -1 or end == -1:
        sys.exit('INTROUVABLE: SLIDES dans Tutorial.js')
    new_slides = u'''const SLIDES = {
  intro: [
    { icon: '\U0001F3E1', title: "C'est quoi FamiQuest ?", text: "Une appli qui transforme les t\u00e2ches quotidiennes de vos enfants (devoirs, rangement, lecture\u2026) en jeu : chaque mission accomplie rapporte des points, des pi\u00e8ces et des minutes de jeu vid\u00e9o m\u00e9rit\u00e9es." },
    { icon: '\U0001F468\u200D\U0001F469\u200D\U0001F467', title: 'Un seul compte pour toute la famille', text: "Sur cet \u00e9cran, le parent cr\u00e9e LE compte familial avec son email et un mot de passe. Ensuite, chaque membre choisira son profil : Espace Parent pour vous, un profil par enfant." },
    { icon: '\U0001F4F1', title: 'Sur plusieurs t\u00e9l\u00e9phones', text: "Installez l'app sur le t\u00e9l\u00e9phone de chaque enfant et connectez-vous partout avec LE M\u00CAME email et mot de passe. Le parent entre dans l'Espace Parent, l'enfant choisit son profil. Tout se synchronise tout seul." },
    { icon: '\U0001F512', title: 'Un conseil avant de commencer', text: "Une fois dans l'app, allez dans R\u00e9glages pour activer un code PIN : il emp\u00eache les enfants d'entrer dans l'Espace Parent. Cr\u00e9ez maintenant votre compte ! \U0001F680" },
  ],
  parent: [
    { icon: '\U0001F44B', title: 'Bienvenue dans votre espace !', text: "Voici comment tout fonctionne, en 6 \u00e9tapes concr\u00e8tes. Vous pourrez revoir ce guide \u00e0 tout moment dans R\u00e9glages \u2192 Revoir le tutoriel." },
    { icon: '\U0001F476', title: '1. Ajoutez vos enfants', text: "Appuyez sur \u00ab Changer \u21c4 \u00bb en haut \u00e0 droite : vous arrivez sur l'\u00e9cran des profils. Appuyez sur \u00ab + Ajouter un enfant \u00bb, choisissez son pr\u00e9nom et son avatar. Recommencez pour chaque enfant." },
    { icon: '\U0001F4CB', title: '2. Cr\u00e9ez une mission', text: "Onglet \u00ab T\u00e2ches \u00bb en bas \u2192 bouton \u00ab + Nouvelle t\u00e2che \u00bb. Choisissez : l'enfant, les jours (aucun coch\u00e9 = tous les jours), l'heure du rappel, les r\u00e9compenses. Activez \u00ab preuve photo \u00bb si vous voulez v\u00e9rifier avec une photo." },
    { icon: '\U0001F514', title: "3. Le t\u00e9l\u00e9phone de l'enfant sonne", text: "\u00c0 l'heure choisie, une notification rappelle sa mission \u00e0 l'enfant (acceptez les notifications \u00e0 la premi\u00e8re ouverture !). Non faite 30 minutes apr\u00e8s l'heure, la mission passe \u00ab En retard \u00bb en rouge." },
    { icon: '\u2705', title: '4. Validez son travail', text: "Onglet \u00ab Valider \u00bb : les photos envoy\u00e9es par vos enfants y apparaissent avec un badge rouge. \u00ab Valider \u00bb envoie les r\u00e9compenses, \u00ab Refuser \u00bb remet la mission \u00e0 faire. Les achats en boutique se confirment ici aussi." },
    { icon: '\U0001F3AE', title: '5. Le jeu vid\u00e9o se m\u00e9rite', text: "Chaque mission valid\u00e9e ajoute des minutes de jeu au compteur de l'enfant. Dans l'onglet Valider, les boutons \u2212 et + vous permettent d'ajuster ce temps \u00e0 tout moment. Vous gardez le dernier mot." },
    { icon: '\U0001F4CA', title: '6. Suivez et personnalisez', text: "L'onglet \u00ab Tableau \u00bb montre les progr\u00e8s et le graphique de la semaine. Dans \u00ab R\u00e9glages \u00bb : code PIN, r\u00e9compenses de la boutique, profils. Bonne aventure en famille ! \U0001F680" },
  ],
  child: [
    { icon: '\U0001F389', title: 'Bienvenue, h\u00e9ros !', text: "Ici, tes t\u00e2ches deviennent des missions de jeu ! Voici comment jouer, en 4 \u00e9tapes rapides." },
    { icon: '\U0001F3E0', title: 'Tes missions du jour', text: "Elles sont sur ton \u00e9cran d'accueil, chacune avec son heure. Ton t\u00e9l\u00e9phone sonnera pour te les rappeler ! Quand tu as fini, appuie sur le bouton vert \u00ab Fait ! \u00bb \u2014 la mission devient verte \u2713." },
    { icon: '\U0001F4F8', title: 'La preuve photo', text: "Si le bouton dit \u00ab \U0001F4F8 Fait ! \u00bb, prends en photo ton travail (ton lit fait, ta chambre rang\u00e9e\u2026). Papa ou maman regarde ta photo et t'envoie tes r\u00e9compenses. Pas de triche ! \U0001F604" },
    { icon: '\u2B50', title: 'Gagne des tr\u00e9sors', text: "Chaque mission te donne : des XP pour monter de niveau, des pi\u00e8ces \U0001FA99 et des minutes de jeu vid\u00e9o \U0001F3AE. Fais au moins une mission chaque jour pour faire grandir ta s\u00e9rie \U0001F525 !" },
    { icon: '\U0001F6CD', title: 'D\u00e9pense tes pi\u00e8ces', text: "Dans la Boutique, ach\u00e8te de vraies r\u00e9compenses (dessert, film, sortie\u2026) que tes parents te remettent. Et regarde tes badges dans Troph\u00e9es \U0001F3C5. \u00c0 toi de jouer !" },
  ],'''
    s = s[:start] + new_slides + s[end:]
    open(p, 'w').write(s)
    print('OK    %s' % p)

# ---------- 7) AuthScreen.js : tutoriel intro ----------
apply('src/screens/AuthScreen.js',
  "import { C } from '../theme';",
  "import { C } from '../theme';\nimport Tutorial from '../components/Tutorial';",
  once_marker="components/Tutorial", label='[import]')

apply('src/screens/AuthScreen.js',
  "    </KeyboardAvoidingView>",
  '      <Tutorial mode="intro" />\n    </KeyboardAvoidingView>',
  once_marker='Tutorial mode="intro"', label='[intro]')

print('')
print('=== TOUS LES CORRECTIFS APPLIQUES ===')
