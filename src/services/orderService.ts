import { v4 as uuidv4 } from 'uuid';
import { Order } from '../models/order';
import { getJSON, setJSON } from './storage';
import { adjustStock, validarStock } from './inventoryService';
import { buscarReceta } from './recipeService';

const KEY = 'orders';

export async function listOrders(): Promise<Order[]> {
  return getJSON<Order[]>(KEY, []);
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<void> {
  const data = await listOrders();
  data.unshift({ id: uuidv4(), ...order, createdAt: Date.now() });
  await setJSON(KEY, data);
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<void> {
  const data = await listOrders();
  const idx = data.findIndex(x => x.id === id);
  if (idx < 0) return;

  const prev = data[idx];
  const next: Order = { ...prev, ...patch };

  // Solo descuenta cuando pasa de PENDING -> IN_PROGRESS
  if (prev.status === 'PENDING' && next.status === 'IN_PROGRESS') {
    const receta = await buscarReceta(prev.recipeId);

    if (receta?.lines?.length) {
      // 1) VALIDAR TODO primero
      for (const line of receta.lines) {
        const cantidadNecesaria = line.qty * prev.batches;
        const ok = await validarStock(line.itemId, cantidadNecesaria);
        if (ok === -1) {
          // NO descontamos nada aún
          throw new Error('Stock insuficiente para esta receta, revise el inventario');
        }
      }

      // 2) DESCONTAR TODO solo si todo pasó
      for (const line of receta.lines) {
        await adjustStock(line.itemId, prev.batches, line.qty, 'enProceso');
      }
    }
  }

  data[idx] = next;
  await setJSON(KEY, data);
}

export async function removeOrder(id: string): Promise<void> {
  const data = await listOrders();
  await setJSON(KEY, data.filter(x => x.id !== id));
}
