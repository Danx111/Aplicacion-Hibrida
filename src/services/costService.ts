import { InventoryItem } from '../models/inventory';
import { Recipe } from '../models/recipe';

const CONVERSION_FACTORS: {[key: string]: number} = {
  //masas (base: gramos)
  'gr': 1,
  'kg': 1000,
  //volumenes (base: mililitros)
  'ml': 1,
  'l': 1000
};

export function convertUnit(amount: number, fromUnit: string, toUnit: string): number{
  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();

  if (!CONVERSION_FACTORS[from] || !CONVERSION_FACTORS[to]) {
    console.error("Unidad no soportada");
    return amount; 
  }
  const baseAmount = amount * CONVERSION_FACTORS[from];
  return baseAmount / CONVERSION_FACTORS[to];
}

export function calcRecipeCost(recipe: Recipe, inventory: InventoryItem[]) {
  let total = 0;
  for (const line of recipe.lines) {
    const item = inventory.find(i => i.id === line.itemId);
    if (!item) continue;
    //harina paquete de 1kg 
    const itemUnit = item.unidadContenidoNeto?.toLowerCase() || 'gr'; //kg
    const netInBase = item.contenidoNeto * (CONVERSION_FACTORS[itemUnit] || 1); //costo?

    const recipeUnit = line.unidadMedida?.toLowerCase();
    const qtyInBase = line.qty * (CONVERSION_FACTORS[recipeUnit]);

    if(netInBase>0){
      const costPerBaseUnit = item.unitCost/netInBase;
      total += qtyInBase * costPerBaseUnit;
    }
    
  }
  const unitCost = recipe.yieldUnits > 0 ? total / recipe.yieldUnits : 0;
  return { totalCost: total, unitCost };
}

export function suggestedUnitPrice(unitCost: number, marginPct: number) {
  return unitCost * (1 + marginPct / 100);
}
