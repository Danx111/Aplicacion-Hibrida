export type OrderStatus = 'PENDING' | 'DELIVERED' | 'IN_PROGRESS';

export interface Order {
  id: string;
  customerName: string;
  recipeId: string;
  batches: number; // lotes
  status: OrderStatus;
  createdAt: number;
}
