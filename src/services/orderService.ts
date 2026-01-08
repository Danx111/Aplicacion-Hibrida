import { v4 as uuidv4 } from 'uuid';
import { Order } from '../models/order';
import { getJSON, setJSON } from './storage';

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
  data[idx] = { ...data[idx], ...patch };
  await setJSON(KEY, data);
}

export async function removeOrder(id: string): Promise<void> {
  const data = await listOrders();
  await setJSON(KEY, data.filter(x => x.id !== id));
}
