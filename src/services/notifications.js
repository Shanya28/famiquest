import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Affichage des notifications même quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Demande la permission et retourne le token Expo Push de l'appareil.
 * Stocké dans Firestore, il permet aux Cloud Functions de prévenir le parent
 * (preuve reçue, rapport hebdomadaire…).
 */
export async function registerForPushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'FamiQuest',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C5CE7',
    });
  }

  if (!Device.isDevice) return null; // les émulateurs ne reçoivent pas de push

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (e) {
    // Pas encore de projet EAS ou Expo Go : les push distants sont indisponibles, on ignore.
    return null;
  }
}

/**
 * Programme les rappels locaux d'une tâche.
 * - days vide ou absent → un rappel QUOTIDIEN à l'heure donnée
 * - days = [0..6] (getDay JS : 0 = dimanche) → un rappel HEBDOMADAIRE par jour choisi
 * @returns {Promise<string[]>} identifiants des notifications (à stocker pour annulation)
 */
export async function scheduleReminders(task) {
  if (Platform.OS === 'web') return []; // pas de rappels locaux dans un navigateur
  const [hour, minute] = task.time.split(':').map(Number);
  const content = {
    title: `${task.icon} Mission du jour !`,
    body: `C'est l'heure de : « ${task.title} ». Accomplis ta mission pour gagner tes récompenses ! 🎮`,
    sound: true,
  };

  if (!task.days || task.days.length === 0 || task.days.length === 7) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: 'calendar', hour, minute, repeats: true },
    });
    return [id];
  }

  // Expo : weekday 1 = dimanche … 7 = samedi  |  JS getDay : 0 = dimanche … 6 = samedi
  const ids = [];
  for (const jsDay of task.days) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: 'calendar', weekday: jsDay + 1, hour, minute, repeats: true },
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelReminders(notificationIds) {
  const ids = Array.isArray(notificationIds)
    ? notificationIds
    : notificationIds ? [notificationIds] : [];
  for (const id of ids) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch (e) { /* déjà annulée */ }
  }
}
