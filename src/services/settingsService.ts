import { getJSON, setJSON } from './storage';

const KEY = 'settings';

export interface Settings {
  marginPct: number;
}

export async function getSettings(): Promise<Settings> {
  return getJSON<Settings>(KEY, { marginPct: 30 });
}

export async function saveSettings(s: Settings): Promise<void> {
  await setJSON(KEY, s);
}
