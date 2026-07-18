import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  setDoc, increment, arrayUnion, serverTimestamp, query, orderBy, getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
} from 'firebase/auth';
import { auth, db, storage } from '../config/firebase';
import { syncAllReminders, registerForPushNotifications } from '../services/notifications';
import { computeBadges, todayKey, yesterdayKey, DEFAULT_REWARDS } from '../utils/gamification';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children: kids }) {
  const [user, setUser] = useState(undefined); // undefined = chargement
  const [session, setSession] = useState(null); // { mode:'parent' } | { mode:'child', childId }
  const [family, setFamily] = useState(null);   // doc famille : pin, pushTokens, settings…
  const [childrenList, setChildrenList] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);       // agrégats quotidiens par enfant
  const [rewards, setRewards] = useState([]);       // boutique
  const [redemptions, setRedemptions] = useState([]); // achats en attente/validés
  const [reports, setReports] = useState([]);       // rapports IA hebdomadaires
  const [celebration, setCelebration] = useState(null); // { xp, coins, screenMin, badges, levelUp }

  const familyId = user?.uid;

  /* ---------- Authentification ---------- */
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ?? null)), []);

  const signup = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Boutique de démarrage : le parent peut tout modifier ensuite
    for (const r of DEFAULT_REWARDS) {
      await addDoc(collection(db, 'families', cred.user.uid, 'rewards'), {
        ...r, createdAt: serverTimestamp(),
      });
    }
    await setDoc(doc(db, 'families', cred.user.uid), {
      createdAt: serverTimestamp(), settings: { weeklyReport: true },
    }, { merge: true });
    return cred;
  };
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = async () => { setSession(null); await signOut(auth); };

  /* ---------- Token push ---------- */
  useEffect(() => {
    if (!familyId) return;
    (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        await setDoc(doc(db, 'families', familyId),
          { pushTokens: arrayUnion(token) }, { merge: true });
      }
    })();
  }, [familyId]);

  /* ---------- Écoutes temps réel ---------- */
  useEffect(() => {
    if (!familyId) {
      setFamily(null); setChildrenList([]); setTasks([]);
      setHistory([]); setRewards([]); setRedemptions([]); setReports([]);
      return;
    }
    const unsubs = [
      onSnapshot(doc(db, 'families', familyId), (s) => setFamily(s.data() || {})),
      onSnapshot(collection(db, 'families', familyId, 'children'),
        (s) => setChildrenList(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'families', familyId, 'tasks'), orderBy('time')),
        (snap) => {
          const today = todayKey();
          setTasks(snap.docs.map((d) => {
            const t = { id: d.id, ...d.data() };
            // Réinitialisation quotidienne : hier "done/pending" → aujourd'hui "todo"
            if (t.day !== today && t.status !== 'todo') {
              updateDoc(doc(db, 'families', familyId, 'tasks', d.id),
                { status: 'todo', day: today, proofUrl: null }).catch(() => {});
              return { ...t, status: 'todo', day: today, proofUrl: null };
            }
            return t;
          }));
        }),
      onSnapshot(collection(db, 'families', familyId, 'history'),
        (s) => setHistory(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'families', familyId, 'rewards'), orderBy('cost')),
        (s) => setRewards(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'families', familyId, 'redemptions'),
        (s) => setRedemptions(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'families', familyId, 'reports'), orderBy('createdAt', 'desc')),
        (s) => setReports(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
    ];
    return () => unsubs.forEach((u) => u());
  }, [familyId]);

  /* ---------- Famille : PIN et réglages ---------- */
  const setPin = (pin) =>
    setDoc(doc(db, 'families', familyId), { pin: pin || null }, { merge: true });
  const setSetting = (key, value) =>
    setDoc(doc(db, 'families', familyId), { settings: { [key]: value } }, { merge: true });

  /* ---------- Enfants ---------- */
  const addChild = (name, avatar, age) =>
    addDoc(collection(db, 'families', familyId, 'children'), {
      name, avatar, age: Number(age) || null,
      xp: 0, coins: 0, streak: 0, screenMinutes: 0, totalDone: 0,
      badges: [], lastDoneDay: null, createdAt: serverTimestamp(),
    });

  const updateChild = (childId, data) =>
    updateDoc(doc(db, 'families', familyId, 'children', childId), data);

  const removeChild = async (childId) => {
    // Supprime les tâches de l'enfant (et leurs rappels locaux)
    for (const t of tasks.filter((x) => x.childId === childId)) {
      await deleteDoc(doc(db, 'families', familyId, 'tasks', t.id));
    }
    return deleteDoc(doc(db, 'families', familyId, 'children', childId));
  };

  const adjustScreen = (childId, delta) =>
    updateDoc(doc(db, 'families', familyId, 'children', childId),
      { screenMinutes: increment(delta) });

  /* ---------- Tâches ---------- */
  const addTask = (task) =>
    addDoc(collection(db, 'families', familyId, 'tasks'), {
      ...task, status: 'todo', day: todayKey(),
      createdAt: serverTimestamp(),
    });

  const deleteTask = (task) =>
    deleteDoc(doc(db, 'families', familyId, 'tasks', task.id));

  /* ---------- Rappels locaux : resynchronises sur CHAQUE appareil connecte ---------- */
  useEffect(() => {
    syncAllReminders(tasks);
  }, [JSON.stringify(tasks.map((t) => ({ i: t.id, h: t.time, d: t.days, n: t.title })))]);

  /* ---------- Récompenses, série 🔥, badges, historique ---------- */
  const grantRewards = async (task) => {
    const childRef = doc(db, 'families', familyId, 'children', task.childId);
    const snap = await getDoc(childRef);
    const c = snap.data() || {};
    const today = todayKey();

    // Série : +1 si la dernière complétion date d'hier, sinon repart à 1
    let streak = c.streak || 0;
    if (c.lastDoneDay !== today) {
      streak = c.lastDoneDay === yesterdayKey() ? streak + 1 : 1;
    }

    const projected = {
      ...c,
      xp: (c.xp || 0) + (task.xp || 0),
      coins: (c.coins || 0) + (task.coins || 0),
      totalDone: (c.totalDone || 0) + 1,
      streak,
    };
    const badges = computeBadges(projected);
    const levelUp = Math.floor(projected.xp / 100) > Math.floor((c.xp || 0) / 100);

    await updateDoc(childRef, {
      xp: increment(task.xp || 0),
      coins: increment(task.coins || 0),
      screenMinutes: increment(task.screenMin || 0),
      totalDone: increment(1),
      streak, lastDoneDay: today,
      ...(badges.length ? { badges: arrayUnion(...badges) } : {}),
    });

    // Historique quotidien → vrais graphiques et rapports IA
    await setDoc(doc(db, 'families', familyId, 'history', `${task.childId}_${today}`), {
      childId: task.childId, date: today,
      done: increment(1), xp: increment(task.xp || 0),
    }, { merge: true });

    return { xp: task.xp, coins: task.coins, screenMin: task.screenMin, badges, levelUp };
  };

  /* ---------- Push direct au parent (sans serveur) ---------- */
  const notifyParent = async (title, body) => {
    try {
      const tokens = family?.pushTokens || [];
      if (tokens.length === 0) return;
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokens.map((to) => ({ to, sound: 'default', title, body }))),
      });
    } catch (e) { /* push indisponible : sans consequence */ }
  };

  /* ---------- Cycle de vie d'une tâche ---------- */
  const completeTask = async (task) => {
    await updateDoc(doc(db, 'families', familyId, 'tasks', task.id),
      { status: 'done', day: todayKey(), completedAt: serverTimestamp() });
    const result = await grantRewards(task);
    setCelebration(result); // animation côté enfant
    return result;
  };

  // Preuve photo : upload puis "pending" (déclenche le push parent via Cloud Function)
  const submitProof = async (task, imageUri) => {
    // Plan gratuit (sans Storage) : la photo compressee est stockee en base64
    // directement dans le document Firestore (limite ~1 Mo par document).
    await updateDoc(doc(db, 'families', familyId, 'tasks', task.id), {
      status: 'pending', proofUrl: imageUri, day: todayKey(), submittedAt: serverTimestamp(),
    });
    const child = childrenList.find((c) => c.id === task.childId);
    notifyParent('📸 Nouvelle preuve à valider',
      `${child?.name || 'Votre enfant'} a terminé « ${task.title} ». Ouvrez FamiQuest pour valider !`);
  };

  const approveTask = async (task) => {
    await updateDoc(doc(db, 'families', familyId, 'tasks', task.id),
      { status: 'done', validatedAt: serverTimestamp() });
    return grantRewards(task);
  };

  const rejectTask = (task) =>
    updateDoc(doc(db, 'families', familyId, 'tasks', task.id),
      { status: 'todo', proofUrl: null });

  const spendScreen = (childId, minutes = 15) => adjustScreen(childId, -minutes);

  /* ---------- Boutique ---------- */
  const addReward = (r) =>
    addDoc(collection(db, 'families', familyId, 'rewards'),
      { ...r, createdAt: serverTimestamp() });
  const deleteReward = (id) =>
    deleteDoc(doc(db, 'families', familyId, 'rewards', id));

  const buyReward = async (child, reward) => {
    if ((child.coins || 0) < reward.cost) return false;
    await updateDoc(doc(db, 'families', familyId, 'children', child.id), {
      coins: increment(-reward.cost), hasBought: true,
      ...( !(child.badges || []).includes('first_buy') ? { badges: arrayUnion('first_buy') } : {} ),
    });
    await addDoc(collection(db, 'families', familyId, 'redemptions'), {
      childId: child.id, rewardTitle: reward.title, rewardIcon: reward.icon,
      cost: reward.cost, status: 'pending', createdAt: serverTimestamp(),
    });
    notifyParent('🛍️ Achat en boutique',
      `${child.name} a acheté « ${reward.title} » (${reward.cost} 🪙). Confirmez la remise !`);
    return true;
  };

  const resolveRedemption = async (redemption, approved) => {
    await updateDoc(doc(db, 'families', familyId, 'redemptions', redemption.id),
      { status: approved ? 'approved' : 'rejected', resolvedAt: serverTimestamp() });
    if (!approved) {
      // Remboursement des pièces
      await updateDoc(doc(db, 'families', familyId, 'children', redemption.childId),
        { coins: increment(redemption.cost) });
    }
  };

  const value = {
    user, familyId, session, setSession, family,
    children: childrenList, tasks, history, rewards, redemptions, reports,
    celebration, clearCelebration: () => setCelebration(null),
    signup, login, logout,
    setPin, setSetting,
    addChild, updateChild, removeChild, adjustScreen,
    addTask, deleteTask,
    completeTask, submitProof, approveTask, rejectTask, spendScreen,
    addReward, deleteReward, buyReward, resolveRedemption,
  };

  return <AppContext.Provider value={value}>{kids}</AppContext.Provider>;
}
