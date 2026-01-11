import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '../models/recipe';
import { getJSON, setJSON } from './storage';

const KEY = 'recipes';

export async function listRecipes(): Promise<Recipe[]> {
  return getJSON<Recipe[]>(KEY, []);
}

export async function upsertRecipe(
  recipe: Omit<Recipe, 'id' | 'updatedAt'>,
  id?: string
): Promise<void> {
  const data = await listRecipes();
  const now = Date.now();

  if (id) {
    const idx = data.findIndex(x => x.id === id);
    if (idx >= 0) data[idx] = { ...data[idx], ...recipe, updatedAt: now };
  } else {
    data.unshift({ id: uuidv4(), ...recipe, updatedAt: now });
  }

  await setJSON(KEY, data);
}

export async function removeRecipe(id: string): Promise<void> {
  const data = await listRecipes();
  await setJSON(KEY, data.filter(x => x.id !== id));
}

export async function buscarReceta(id:string): Promise<Recipe> {
  const data = await listRecipes();
  const indice = data.findIndex(x => x.id === id);
  return data[indice];  
}