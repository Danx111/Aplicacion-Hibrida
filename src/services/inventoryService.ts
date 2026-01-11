import { v4 as uuidv4 } from 'uuid';
import { InventoryItem } from '../models/inventory';
import { getJSON, setJSON } from './storage';

const KEY = 'inventory';

export const INVENTORY_UPDATED_EVENT = 'inventory-updated';

function emitInventoryUpdated() {
  window.dispatchEvent(new Event(INVENTORY_UPDATED_EVENT));
}

function clamp0(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function sanitizeItem(it: InventoryItem): InventoryItem {
  return {
    ...it,
    stock: clamp0(it.stock),
    unitCost: clamp0(it.unitCost),
    contenidoNeto: clamp0(it.contenidoNeto),
    contenidoDisponible: clamp0(it.contenidoDisponible),
    updatedAt: it.updatedAt ?? Date.now(),
  };
}

export async function listInventory(): Promise<InventoryItem[]> {
  const data = await getJSON<InventoryItem[]>(KEY, []);
  return (data ?? []).map(sanitizeItem);
}

export async function upsertInventory(
  item: Omit<InventoryItem, 'id' | 'updatedAt'>,
  id?: string
): Promise<void> {
  const data = await listInventory();
  const now = Date.now();

  const safeItem = {
    ...item,
    stock: clamp0(item.stock),
    unitCost: clamp0(item.unitCost),
    contenidoNeto: clamp0(item.contenidoNeto),
    contenidoDisponible: clamp0(item.contenidoDisponible),
    unidadContenidoNeto: item.unidadContenidoNeto ?? '',
  };

  if (id) {
    const idx = data.findIndex(x => x.id === id);
    if (idx >= 0) data[idx] = sanitizeItem({ ...data[idx], ...safeItem, updatedAt: now });
  } else {
    data.unshift(sanitizeItem({ id: uuidv4(), ...safeItem, updatedAt: now } as InventoryItem));
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

  const item = data[idx];
  const now = Date.now();

  let nextDisponible = item.contenidoDisponible ?? 0;

  if (lugarAumento === 'botonAumenta') {
    nextDisponible = (item.contenidoDisponible ?? 0) + (item.contenidoNeto ?? 0);
  } else if (lugarAumento === 'botondisminuye') {
    nextDisponible = (item.contenidoDisponible ?? 0) - (item.contenidoNeto ?? 0);
    nextDisponible = Math.max(0, nextDisponible); // nunca negativo
  } else {
    // enProceso: descuenta qty * batches
    const required = delta * batches;
    nextDisponible = (item.contenidoDisponible ?? 0) - required;

    if (nextDisponible < 0) {
      throw new Error('Stock insuficiente para esta receta, revise el inventario');
    }
  }

  data[idx] = sanitizeItem({ ...item, contenidoDisponible: nextDisponible, updatedAt: now });
  await setJSON(KEY, data);
  emitInventoryUpdated();
}

export async function validarStock(id: string, cantidad: number): Promise<number> {
  const data = await listInventory();
  const idx = data.findIndex(x => x.id === id);
  if (idx < 0) return -1;
  if ((data[idx].contenidoDisponible ?? 0) < cantidad) return -1;
  return 0;
}

/** Para pedidos: primero valida TODO, luego descuenta TODO (sin descuentos parciales) */
export type ConsumptionLine = { itemId: string; qty: number };

export async function consumeStockAtomic(lines: ConsumptionLine[], batches: number): Promise<void> {
  const data = await listInventory();
  const now = Date.now();

  // 1) agrupar por itemId
  const requiredMap = new Map<string, number>();
  for (const l of lines) {
    const req = clamp0(l.qty) * clamp0(batches);
    requiredMap.set(l.itemId, (requiredMap.get(l.itemId) ?? 0) + req);
  }

  // 2) validar TODO antes de tocar nada
  for (const [itemId, required] of requiredMap.entries()) {
    const idx = data.findIndex(x => x.id === itemId);
    if (idx < 0) throw new Error('Stock insuficiente para esta receta, revise el inventario');

    const disponible = data[idx].contenidoDisponible ?? 0;
    if (disponible < required) {
      throw new Error('Stock insuficiente para esta receta, revise el inventario');
    }
  }

  // 3) descontar TODO
  for (const [itemId, required] of requiredMap.entries()) {
    const idx = data.findIndex(x => x.id === itemId);
    const item = data[idx];
    const next = (item.contenidoDisponible ?? 0) - required;

    data[idx] = sanitizeItem({
      ...item,
      contenidoDisponible: Math.max(0, next),
      updatedAt: now,
    });
  }

  await setJSON(KEY, data);
  emitInventoryUpdated();
}

export function stockReal(stock: number, unidades: number) {
  return clamp0(stock) * clamp0(unidades);
}
