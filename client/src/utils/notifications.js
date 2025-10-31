// notifications.js - simple browser notification and sound helper

export async function requestPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (e) {
      // ignore
    }
  }
}

export function sendBrowserNotification(title, options = {}) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
  } catch (e) {
    // ignore
    // Some browsers may throw if notifications are blocked
  }
}

// Play a short beep using WebAudio API (no external asset required)
export function playSound() {
  try {
    if (typeof window === 'undefined' || !window.AudioContext && !window.webkitAudioContext) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880; // A5-ish beep
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.value = 0.05;
    o.start();
    setTimeout(() => {
      o.stop();
      try { ctx.close(); } catch (e) { }
    }, 120);
  } catch (e) {
    // ignore audio errors
  }
}

export default {
  requestPermission,
  sendBrowserNotification,
  playSound,
};
