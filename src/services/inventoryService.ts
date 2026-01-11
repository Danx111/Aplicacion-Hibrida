import { v4 as uuidv4 } from 'uuid';
import { InventoryItem } from '../models/inventory';
import { getJSON, setJSON } from './storage';

const KEY = 'inventory';

export const INVENTORY_UPDATED_EVENT = 'inventory-updated';

function emitInventoryUpdated() {
  window.dispatchEvent(new Event(INVENTORY_UPDATED_EVENT));
}

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

  emitInventoryUpdated();
}

export async function removeInventory(id: string): Promise<void> {
  const data = await listInventory();
  await setJSON(KEY, data.filter(x => x.id !== id));

  emitInventoryUpdated();
}

export async function adjustStock(
  id: string,
  batches: number,
  delta: number,
  lugarAumento: 'botonAumenta' | 'botondisminuye' | 'enProceso'
): Promise<void> {
  const data = await listInventory();
  const idx = data.findIndex(x => x.id === id);
  if (idx < 0) return;

  if (lugarAumento === 'botonAumenta') {
    data[idx].contenidoDisponible = data[idx].contenidoDisponible + data[idx].contenidoNeto;
  } else if (lugarAumento === 'botondisminuye') {
    data[idx].contenidoDisponible = data[idx].contenidoDisponible - data[idx].contenidoNeto;
  } else {
    // enProceso: descuenta qty * batches
    data[idx].contenidoDisponible = data[idx].contenidoDisponible - (delta * batches);
  }

  data[idx].updatedAt = Date.now();
  await setJSON(KEY, data);

  emitInventoryUpdated();
}

export async function validarStock(id: string, cantidad: number): Promise<number> {
  const data = await listInventory();
  const idx = data.findIndex(x => x.id === id);
  if (idx < 0) return -1; // si no existe el item, también es insuficiente
  if (data[idx].contenidoDisponible < cantidad) return -1;
  return 0;
}

export function stockReal(stock: number, unidades: number) {
  return stock * unidades;
}
