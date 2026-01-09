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



export function calcRecipeCost(recipe: Recipe, inventory: InventoryItem[]) {
  let total = 0;
  for (const line of recipe.lines) {
    const item = inventory.find(i => i.id === line.itemId);
    if (!item) continue;
    total += line.qty * item.unitCost;
  }
  const unitCost = recipe.yieldUnits > 0 ? total / recipe.yieldUnits : 0;
  return { totalCost: total, unitCost };
}

export function suggestedUnitPrice(unitCost: number, marginPct: number) {
  return unitCost * (1 + marginPct / 100);
}
