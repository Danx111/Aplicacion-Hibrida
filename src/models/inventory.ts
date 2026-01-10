export interface InventoryItem {
  id: string;
  name: string;
  stock: number;     // unidades
  unitCost: number;  // costo por unidad
  updatedAt: number; 
  contenidoNeto: number;  //cantidad que trae el empaque
  unidadContenidoNeto: string;   //unidad del empaque
  contenidoDisponible: number;
}
