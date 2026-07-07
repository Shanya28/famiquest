export const levelOf = (xp) => Math.floor((xp || 0) / 100) + 1;
export const xpInLevel = (xp) => (xp || 0) % 100;

/** Titres ludiques affichés à côté du niveau de l'enfant */
export const LEVEL_TITLES = [
  'Petit Curieux', 'Apprenti Héros', 'Explorateur', 'Aventurier',
  'Champion des Missions', 'As de la Maison', 'Super Organisé',
  'Maître du Temps', 'Héros de la Famille', 'Légende FamiQuest',
];
export const levelTitle = (xp) =>
  LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, levelOf(xp) - 1)];

export const BADGES = {
  first_task: { icon: '🎯', name: 'Première mission', desc: '1re tâche validée' },
  tasks_10: { icon: '🎖️', name: 'Dizaine parfaite', desc: '10 tâches validées' },
  tasks_50: { icon: '🏵️', name: 'Cinquantenaire', desc: '50 tâches validées' },
  tasks_100: { icon: '👑', name: 'Centurion', desc: '100 tâches validées' },
  streak_3: { icon: '✨', name: 'Bon départ', desc: '3 jours d’affilée' },
  streak_5: { icon: '🔥', name: 'Série de 5', desc: '5 jours d’affilée' },
  streak_10: { icon: '⚡', name: 'Série de 10', desc: '10 jours d’affilée' },
  streak_30: { icon: '🌟', name: 'Inarrêtable', desc: '30 jours d’affilée' },
  level_5: { icon: '🚀', name: 'Niveau 5', desc: 'Atteindre le niveau 5' },
  level_10: { icon: '🏆', name: 'Niveau 10', desc: 'Atteindre le niveau 10' },
  rich_100: { icon: '💰', name: 'Petit trésor', desc: '100 pièces accumulées' },
  first_buy: { icon: '🛍️', name: 'Premier achat', desc: '1re récompense achetée' },
};

/**
 * Badges à débloquer, selon l'état PROJETÉ de l'enfant (après récompenses).
 */
export function computeBadges(c) {
  const owned = c.badges || [];
  const earned = [];
  const add = (id) => { if (!owned.includes(id) && !earned.includes(id)) earned.push(id); };

  const done = c.totalDone || 0;
  if (done >= 1) add('first_task');
  if (done >= 10) add('tasks_10');
  if (done >= 50) add('tasks_50');
  if (done >= 100) add('tasks_100');
  const s = c.streak || 0;
  if (s >= 3) add('streak_3');
  if (s >= 5) add('streak_5');
  if (s >= 10) add('streak_10');
  if (s >= 30) add('streak_30');
  const lvl = levelOf(c.xp);
  if (lvl >= 5) add('level_5');
  if (lvl >= 10) add('level_10');
  if ((c.coins || 0) >= 100) add('rich_100');
  if (c.hasBought) add('first_buy');
  return earned;
}

/* ---------------- Dates ---------------- */

export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10); // YYYY-MM-DD
export const yesterdayKey = () => {
  const d = new Date(); d.setDate(d.getDate() - 1); return todayKey(d);
};
/** Les 7 derniers jours (du plus ancien à aujourd'hui) */
export const last7Days = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return todayKey(d);
  });

export const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']; // index = getDay()
export const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/** La tâche est-elle programmée aujourd'hui ? (days: tableau getDay 0-6, vide = tous les jours) */
export const isScheduledToday = (task) =>
  !task.days || task.days.length === 0 || task.days.includes(new Date().getDay());

/** Statut affiché : une tâche "todo" dont l'heure est dépassée de 30 min devient "late" */
export function effectiveStatus(task) {
  if (task.status !== 'todo') return task.status;
  const [h, m] = (task.time || '00:00').split(':').map(Number);
  const now = new Date();
  const passed = now.getHours() * 60 + now.getMinutes() > h * 60 + m + 30;
  return passed ? 'late' : 'todo';
}

/* ---------------- Récompenses de boutique par défaut ---------------- */

export const DEFAULT_REWARDS = [
  { title: '30 min de tablette bonus', icon: '📱', cost: 40 },
  { title: 'Choisir le film du soir', icon: '🎬', cost: 30 },
  { title: 'Dessert préféré', icon: '🍰', cost: 25 },
  { title: 'Sortie au parc', icon: '🌳', cost: 60 },
  { title: 'Se coucher 30 min plus tard', icon: '🌙', cost: 50 },
  { title: 'Petit jouet surprise', icon: '🎁', cost: 100 },
];
