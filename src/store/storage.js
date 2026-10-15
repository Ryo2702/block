// Cache successful writes so timer and ammo changes do not rewrite saved progress.
export function safeStorage(getStorage, onError) {
  let lastKey, lastValue, reported = false;
  const report = () => {
    if (reported) return;
    reported = true;
    queueMicrotask(onError);
  };
  return {
    getItem(key) {
      try { return getStorage().getItem(key); }
      catch { report(); return null; }
    },
    setItem(key, value) {
      if (key === lastKey && value === lastValue) return;
      try {
        getStorage().setItem(key, value);
        lastKey = key;
        lastValue = value;
      } catch { report(); }
    },
    removeItem(key) {
      lastKey = lastValue = undefined;
      try { getStorage().removeItem(key); }
      catch { report(); }
    },
  };
}
