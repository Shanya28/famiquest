/**
 * FamiQuest — Backend Firebase Cloud Functions (Node 20)
 *
 * 1. /assistant : proxy sécurisé vers l'API Anthropic (la clé reste côté serveur,
 *    JAMAIS dans l'application mobile).
 * 2. onProofSubmitted : Firestore trigger — une tâche passe en "pending" →
 *    push Expo sur les appareils du parent.
 * 3. onRewardBought : Firestore trigger — un enfant achète en boutique →
 *    push Expo au parent.
 * 4. weeklyReport : fonction PLANIFIÉE (dimanche 18h) — analyse la semaine de
 *    chaque famille via Claude, écrit un rapport dans Firestore et push le parent.
 *
 * Déploiement :
 *   cd functions && npm install
 *   firebase functions:secrets:set ANTHROPIC_API_KEY
 *   firebase deploy --only functions
 */

const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
const db = () => admin.firestore();

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

async function callClaude(system, messages, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system,
      messages,
    }),
  });
  const data = await response.json();
  return (data.content || []).map((b) => b.text || '').join('\n').trim();
}

async function sendPush(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tokens.map((to) => ({ to, sound: 'default', title, body, data }))),
  });
}

/* ------------------------------------------------------------------ */
/* 1) Assistant IA : proxy sécurisé                                    */
/* ------------------------------------------------------------------ */

const parentSystem = (familyState) =>
  `Tu es Fami, l'assistant virtuel intégré de FamiQuest, une application de gestion des habitudes familiales (tâches planifiées, notifications, validation par photo, gamification : XP, pièces, badges, séries, boutique de récompenses, temps d'écran gagné en récompense). Tu parles à un PARENT. Ton ton est professionnel, chaleureux et concis (3-5 phrases max). Tu guides la configuration, expliques les fonctionnalités, analyses les données ci-dessous et proposes des recommandations concrètes (ajuster un horaire, une récompense, une routine). Données familiales actuelles : ${familyState}. Réponds toujours en français.`;

const childSystem = (familyState, childName) =>
  `Tu es Fami, le coach de missions de FamiQuest, une appli qui transforme les tâches quotidiennes en jeu (XP, pièces, badges, séries, boutique, minutes de jeu vidéo à gagner). Tu parles à un ENFANT nommé ${childName}. Ton ton est très ludique, encourageant, avec des emojis, phrases courtes (2-4 phrases max). Tu rappelles ses missions du jour, l'encourages, expliques comment gagner des récompenses. Jamais de contenu inadapté à un enfant. Données : ${familyState}. Réponds toujours en français.`;

exports.assistant = onRequest(
  { secrets: [ANTHROPIC_API_KEY], cors: true, region: 'us-central1' },
  async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

    const { mode, childName, familyState, messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages requis' });
    }

    const system = mode === 'child'
      ? childSystem(familyState || '{}', childName || 'l’enfant')
      : parentSystem(familyState || '{}');

    try {
      const reply = await callClaude(
        system,
        messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
        ANTHROPIC_API_KEY.value()
      );
      return res.json({ reply });
    } catch (e) {
      console.error('Erreur Anthropic:', e);
      return res.status(502).json({ error: 'Assistant indisponible' });
    }
  }
);

/* ------------------------------------------------------------------ */
/* 2) Push au parent : preuve photo soumise                            */
/* ------------------------------------------------------------------ */

exports.onProofSubmitted = onDocumentUpdated(
  'families/{familyId}/tasks/{taskId}',
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (before.status === 'pending' || after.status !== 'pending') return;

    const { familyId } = event.params;
    const familySnap = await db().doc(`families/${familyId}`).get();
    const childSnap = await db().doc(`families/${familyId}/children/${after.childId}`).get();
    const childName = childSnap.data()?.name || 'Votre enfant';

    await sendPush(
      familySnap.data()?.pushTokens,
      '📸 Nouvelle preuve à valider',
      `${childName} a terminé « ${after.title} ». Ouvrez FamiQuest pour valider !`,
      { taskId: event.params.taskId }
    );
  }
);

/* ------------------------------------------------------------------ */
/* 3) Push au parent : achat en boutique                               */
/* ------------------------------------------------------------------ */

exports.onRewardBought = onDocumentCreated(
  'families/{familyId}/redemptions/{redemptionId}',
  async (event) => {
    const r = event.data.data();
    if (r.status !== 'pending') return;

    const { familyId } = event.params;
    const familySnap = await db().doc(`families/${familyId}`).get();
    const childSnap = await db().doc(`families/${familyId}/children/${r.childId}`).get();
    const childName = childSnap.data()?.name || 'Votre enfant';

    await sendPush(
      familySnap.data()?.pushTokens,
      '🛍️ Achat en boutique',
      `${childName} a acheté « ${r.rewardTitle} » (${r.cost} 🪙). Confirmez la remise dans FamiQuest !`
    );
  }
);

/* ------------------------------------------------------------------ */
/* 4) Rapport IA hebdomadaire (dimanche 18h, Europe/Paris)             */
/* ------------------------------------------------------------------ */

exports.weeklyReport = onSchedule(
  {
    schedule: 'every sunday 18:00',
    timeZone: 'Europe/Paris',
    secrets: [ANTHROPIC_API_KEY],
    region: 'us-central1',
  },
  async () => {
    const familiesSnap = await db().collection('families').get();
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoKey = weekAgo.toISOString().slice(0, 10);
    const todayFr = new Date().toLocaleDateString('fr-FR');

    for (const famDoc of familiesSnap.docs) {
      const family = famDoc.data();
      if (family.settings?.weeklyReport === false) continue;

      try {
        const [childrenSnap, historySnap, tasksSnap] = await Promise.all([
          famDoc.ref.collection('children').get(),
          famDoc.ref.collection('history').where('date', '>=', weekAgoKey).get(),
          famDoc.ref.collection('tasks').get(),
        ]);
        if (childrenSnap.empty) continue;

        const payload = {
          enfants: childrenSnap.docs.map((d) => {
            const c = d.data();
            return {
              nom: c.name, xp: c.xp, serie: c.streak, tempsEcranMin: c.screenMinutes,
              tachesPlanifiees: tasksSnap.docs
                .filter((t) => t.data().childId === d.id)
                .map((t) => ({ titre: t.data().title, heure: t.data().time })),
              historiqueSemaine: historySnap.docs
                .filter((h) => h.data().childId === d.id)
                .map((h) => ({ date: h.data().date, validees: h.data().done, xpGagne: h.data().xp })),
            };
          }),
        };

        const text = await callClaude(
          `Tu es Fami, l'assistant de l'application FamiQuest. Rédige pour un PARENT le rapport hebdomadaire de sa famille, en français, en 150-220 mots, ton chaleureux et concret. Structure : 1) points forts de la semaine par enfant, 2) points d'attention (tâches peu réalisées, jours creux), 3) deux ou trois recommandations actionnables (horaires, récompenses, routines). Pas de titre général, pas de markdown complexe, des paragraphes courts.`,
          [{ role: 'user', content: `Données de la semaine : ${JSON.stringify(payload)}` }],
          ANTHROPIC_API_KEY.value()
        );
        if (!text) continue;

        await famDoc.ref.collection('reports').add({
          text, weekOf: todayFr,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await sendPush(
          family.pushTokens,
          '📈 Votre rapport de la semaine est prêt',
          'Fami a analysé la semaine de vos enfants. Découvrez ses recommandations dans FamiQuest !'
        );
      } catch (e) {
        console.error(`Rapport hebdo échoué pour ${famDoc.id}:`, e);
      }
    }
  }
);
