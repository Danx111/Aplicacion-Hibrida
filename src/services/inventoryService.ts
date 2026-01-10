import { v4 as uuidv4 } from 'uuid';
import { InventoryItem } from '../models/inventory';
import { getJSON, setJSON } from './storage';

const KEY = 'inventory';

export async function listInventory(): Promise<InventoryItem[]> {
  return getJSON<InventoryItem[]>(KEY, []);
}

export async function upsertInventory(
  item: Omit<InventoryItem, 'id' | 'updatedAt'>,
  id?: string
): Promise<void> {
  const data = await listInventory();
  const now = Date.now();

  if (id) {
    const idx = data.findIndex(x => x.id === id);
    if (idx >= 0) data[idx] = { ...data[idx], ...item, updatedAt: now };
  } else {
    data.unshift({ id: uuidv4(), ...item, updatedAt: now });
  }

  await setJSON(KEY, data);
}

export async function removeInventory(id: string): Promise<void> {
  const data = await listInventory();
  await setJSON(KEY, data.filter(x => x.id !== id));
}

export async function adjustStock(id: string, delta: number): Promise<void> {
  const data = await listInventory();
  const idx = data.findIndex(x => x.id === id);
  if (idx < 0) return;

  data[idx].stock = Math.max(0, data[idx].stock + delta);
  data[idx].contenidoDisponible = data[idx].stock * data[idx].contenidoNeto
  data[idx].updatedAt = Date.now();
  await setJSON(KEY, data);
}

export function stockReal(stock: number, unidades: number){
  const disponible = stock * unidades;
  return disponible;
}
