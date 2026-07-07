# 🏡 FamiQuest — App mobile de gestion des habitudes familiales

Application React Native / Expo complète : planning de tâches par jours de la semaine, notifications de rappel, preuve photo par caméra, validation parentale, gamification (XP, niveaux à titres, 12 badges, séries 🔥 automatiques, classement, célébrations animées), boutique de récompenses avec pièces virtuelles, temps de jeu vidéo gagné en récompense, code PIN parental, tableau de bord avec graphiques sur données réelles, rapports IA hebdomadaires automatiques et assistant « Fami » propulsé par Claude.

## Architecture

```
famiquest/
├── App.js                      Point d'entrée
├── app.json                    Config Expo (notifications, caméra, identifiants)
├── .env.example                Variables d'environnement à copier vers .env
├── src/
│   ├── config/firebase.js      Init Firebase (Auth persistant, Firestore, Storage)
│   ├── context/AppContext.js   État global + listeners temps réel + logique métier
│   ├── services/notifications.js  Permissions, token push, rappels quotidiens
│   ├── utils/gamification.js   Niveaux, badges, règles de déblocage
│   ├── components/
│   │   ├── UI.js               Composants réutilisables (jauge temps d'écran…)
│   │   ├── Celebration.js      Confettis animés + niveau supérieur + badges
│   │   └── PinModal.js         Pavé de code PIN parental
│   ├── navigation/index.js     Auth → Profils (PIN) → Tabs parent / enfant
│   └── screens/
│       ├── AuthScreen.js           Connexion / création du compte familial
│       ├── ProfileSelectScreen.js  Choix du profil + ajout d'enfants
│       ├── AssistantScreen.js      Chat IA (parent et enfant)
│       ├── parent/  Dashboard (graphiques réels + rapports IA), Tâches, Validation, Réglages
│       └── child/   Missions (caméra + célébrations), Boutique, Trophées
├── functions/                  Backend Cloud Functions
│   └── index.js                Proxy IA + push preuve + push achat + rapport hebdo planifié
├── firestore.rules             Sécurité : chaque famille isolée
└── storage.rules               Sécurité : photos privées par famille
```

**Modèle de données Firestore (temps réel via `onSnapshot`) :**
- `families/{uid}` → `{ pushTokens: [], pin, settings: { weeklyReport } }`
- `families/{uid}/children/{id}` → `{ name, avatar, xp, coins, streak, screenMinutes, totalDone, lastDoneDay, badges }`
- `families/{uid}/tasks/{id}` → `{ title, icon, time, days: [0-6], childId, xp, coins, screenMin, proofRequired, status, proofUrl, day, notificationIds }`
- `families/{uid}/history/{childId_date}` → `{ childId, date, done, xp }` — agrégat quotidien réel (graphiques, séries, rapports)
- `families/{uid}/rewards/{id}` → `{ title, icon, cost }` — boutique gérée par le parent (pré-remplie à l'inscription)
- `families/{uid}/redemptions/{id}` → `{ childId, rewardTitle, rewardIcon, cost, status }` — achats à confirmer
- `families/{uid}/reports/{id}` → `{ text, weekOf, createdAt }` — rapports IA hebdomadaires

Cycle d'une tâche : `todo` → (`late` affiché automatiquement 30 min après l'heure) → (`pending` si preuve photo) → `done`. Réinitialisation quotidienne automatique. La série 🔥 est recalculée à chaque complétion (jour consécutif → +1, sinon repart à 1).

## 1. Prérequis

- Node.js 20+, un compte [Firebase](https://console.firebase.google.com) et un compte [Expo](https://expo.dev)
- `npm install -g eas-cli firebase-tools`

## 2. Configuration Firebase

1. Créez un projet Firebase, puis une **application Web** (l'app Expo utilise le SDK JS).
2. Activez : **Authentication** (Email/Mot de passe), **Firestore**, **Storage**.
3. Copiez `.env.example` vers `.env` et remplissez les clés `EXPO_PUBLIC_FIREBASE_*` avec la config de votre app web.
4. Déployez les règles de sécurité :
   ```bash
   firebase login
   firebase use VOTRE-PROJET
   firebase deploy --only firestore:rules,storage
   ```

## 3. Backend IA + push (Cloud Functions)

> ⚠️ La clé API Anthropic ne doit **jamais** être embarquée dans l'app mobile. Le proxy `functions/index.js` la garde côté serveur. Il gère aussi l'envoi de push au parent quand un enfant soumet une preuve.

```bash
cd functions && npm install && cd ..
firebase functions:secrets:set ANTHROPIC_API_KEY   # collez votre clé sk-ant-...
firebase deploy --only functions
```

Récupérez l'URL de la fonction `assistant` affichée après le déploiement et mettez-la dans `.env` → `EXPO_PUBLIC_ASSISTANT_URL`.

## 4. Lancer l'application

```bash
npm install
npx expo start
```

Scannez le QR code avec **Expo Go** (⚠️ depuis le SDK 53, les notifications push distantes nécessitent un *development build*, voir §5 — les rappels locaux fonctionnent partout).

## 5. Build & déploiement (EAS)

```bash
eas login
eas init                        # génère le projectId → collez-le dans app.json (extra.eas.projectId)
eas build --profile development --platform android   # build de dev avec push
eas build --platform android    # build de production (.aab pour Play Store)
eas build --platform ios        # nécessite un compte Apple Developer
```

Avant publication, remplacez `com.votresociete.famiquest` dans `app.json` par votre propre identifiant.

## 6. Comment ça marche

- **Rappels** : à la création d'une tâche, `expo-notifications` programme des notifications locales à l'heure choisie — quotidiennes, ou hebdomadaires sur les jours de la semaine sélectionnés. La suppression de la tâche annule tous ses rappels.
- **Preuve photo** : l'enfant appuie sur « 📸 Fait ! » → caméra native → la photo est uploadée dans Storage → la tâche passe en `pending` → la Cloud Function envoie un **push** au parent → le parent voit la photo dans l'onglet Valider et accorde (ou non) les récompenses.
- **Temps réel** : parents et enfants écoutent les mêmes documents Firestore ; toute action est visible instantanément sur tous les appareils connectés au compte familial.
- **Temps d'écran** : chaque tâche validée crédite des minutes ; l'enfant peut « dépenser » 15 min ; le parent ajuste manuellement (+/−).
- **Boutique** : le parent gère un catalogue de récompenses (pré-rempli à la création du compte) ; l'enfant achète avec ses pièces ; le parent reçoit un push et confirme la remise dans l'onglet Valider (un refus rembourse automatiquement les pièces).
- **Célébrations** : chaque mission terminée déclenche une pluie de confettis animée avec le détail des gains, les badges débloqués et l'annonce du passage de niveau.
- **Code PIN** : activable dans Réglages, il verrouille l'Espace Parent — indispensable quand l'enfant utilise le même appareil.
- **Graphiques réels** : chaque validation alimente la collection `history` ; le tableau de bord affiche les tâches validées des 7 derniers jours par enfant, à partir de ces données.
- **Rapports IA hebdomadaires** : chaque dimanche à 18h (fuseau Europe/Paris, modifiable dans `functions/index.js`), une fonction planifiée envoie l'historique de la semaine à Claude, écrit le rapport dans Firestore (visible dans le tableau de bord) et notifie le parent par push. Désactivable famille par famille dans Réglages.
- **Assistant Fami** : le chat envoie l'historique + un résumé de l'état familial au proxy, qui interroge Claude avec un prompt adapté (conseiller pour le parent, coach ludique pour l'enfant).

## 7. Notes et pistes d'évolution

- Le PIN est stocké dans le document famille (protégé par les règles Firestore, lisible uniquement par le compte parent) : c'est un verrou de confort contre l'enfant, pas un mécanisme cryptographique. Pour durcir : hacher le PIN côté client avant stockage.
- La fonction planifiée `weeklyReport` nécessite le plan Firebase Blaze (comme toutes les fonctions avec appels réseau sortants).
- Idées suivantes : appareil enfant autonome (code familial d'appairage), mode hors-ligne avec file d'attente, thèmes d'avatars à débloquer avec les pièces, widgets d'écran d'accueil, export PDF des rapports.
