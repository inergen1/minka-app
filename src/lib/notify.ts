/** Browser Notification helper (no server required).
 *  Works when the app is open or installed as a PWA.
 *  iOS 16.4+ and Android Chrome support PWA notifications via service worker.
 */

type TimerMap = Map<string, ReturnType<typeof setTimeout>>;
const timers: TimerMap = new Map();

export function notifySupported() {
  return typeof Notification !== "undefined";
}

export function notifyState(): NotificationPermission | "unsupported" {
  if (!notifySupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotifyPermission(): Promise<NotificationPermission> {
  if (!notifySupported()) return "denied";
  const result = await Notification.requestPermission();
  return result;
}

/** Schedule a browser notification at a specific UTC ms timestamp.
 *  id is used to cancel it later. */
export function scheduleNotification(id: string, title: string, body: string, atMs: number) {
  cancelNotification(id);
  const delay = atMs - Date.now();
  if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return; // ignore past or >24h
  const t = setTimeout(async () => {
    timers.delete(id);
    if (Notification.permission !== "granted") return;
    // Try service worker first (works when app is backgrounded on PWA)
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png" });
        return;
      } catch {/* fall through */}
    }
    new Notification(title, { body, icon: "/icon-192.png" });
  }, delay);
  timers.set(id, t);
}

export function cancelNotification(id: string) {
  const t = timers.get(id);
  if (t !== undefined) { clearTimeout(t); timers.delete(id); }
}

/** Schedule habit reminder for today if the remind time hasn't passed yet. */
export function scheduleHabitReminder(habitId: string, habitName: string, remindHHMM: string) {
  if (Notification.permission !== "granted") return;
  const [h, m] = remindHHMM.split(":").map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  scheduleNotification(`habit-${habitId}`, habitName, "حان وقت عادتك ✓", target.getTime());
}

/** Schedule a 15-min-before reminder for a calendar block. */
export function scheduleBlockReminder(blockId: string, title: string, dateKey: string, startHour: number) {
  if (Notification.permission !== "granted") return;
  const [y, mo, d] = dateKey.split("-").map(Number);
  const blockMs = new Date(y, mo - 1, d, Math.floor(startHour), (startHour % 1) * 60).getTime();
  const remindMs = blockMs - 15 * 60 * 1000;
  scheduleNotification(`block-${blockId}`, title, "موعد بعد 15 دقيقة", remindMs);
}
