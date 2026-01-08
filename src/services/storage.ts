import localforage from 'localforage';

localforage.config({
  name: 'cookie-log',
  storeName: 'cookie_log_store',
});

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  const v = await localforage.getItem<T>(key);
  return v ?? fallback;
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await localforage.setItem(key, value);
}
