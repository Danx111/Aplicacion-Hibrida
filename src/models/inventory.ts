export interface InventoryItem {
  id: string;
  name: string;
  stock: number;     // unidades
  unitCost: number;  // costo por unidad
  updatedAt: number;
}
