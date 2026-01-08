export interface RecipeLine {
  itemId: string;
  qty: number; // unidades usadas por 1 lote
}

export interface Recipe {
  id: string;
  name: string;
  yieldUnits: number; // unidades producidas por 1 lote
  lines: RecipeLine[];
  updatedAt: number;
}
