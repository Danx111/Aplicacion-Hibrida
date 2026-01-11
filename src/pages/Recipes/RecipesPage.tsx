import {
    IonAlert,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonPage,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
} from '@ionic/react';
import { add, pencil, trash } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';

import { InventoryItem } from '../../models/inventory';
import { Recipe, RecipeLine } from '../../models/recipe';
import { listInventory } from '../../services/inventoryService';
import { listRecipes, removeRecipe, upsertRecipe } from '../../services/recipeService';
import { calcRecipeCost } from '../../services/costService';

function toNumber(v: any, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

export default function RecipesPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);

    const [query, setQuery] = useState('');

    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | undefined>(undefined);

    const [name, setName] = useState('');
    const [yieldUnits, setYieldUnits] = useState<number>(12);
    const [lines, setLines] = useState<RecipeLine[]>([]);

    const [lineItemId, setLineItemId] = useState<string>('');
    const [lineQty, setLineQty] = useState<number>(1);
    const [unitM, setUnitM] =useState('');

    const [deleteId, setDeleteId] = useState<string | null>(null);

    async function load() {
        const [inv, rec] = await Promise.all([listInventory(), listRecipes()]);
        setInventory(inv);
        setRecipes(rec);
    }

    useEffect(() => {
        load();
    }, []);

    const editingRecipe = useMemo(
        () => recipes.find((r) => r.id === editingId),
        [recipes, editingId]
    );

    const filteredRecipes = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = !q
            ? recipes
            : recipes.filter((r) => r.name.toLowerCase().includes(q));

        return [...base].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    }, [recipes, query]);

    async function openCreate() {
        await load();

        setEditingId(undefined);
        setName('');
        setYieldUnits(12);
        setLines([]);
        setLineItemId('');
        setLineQty(1);
        setOpen(true);
    }

    async function openEdit(id: string) {
        await load();

        const r = recipes.find((x) => x.id === id);
        if (!r) return;

        setEditingId(id);
        setName(r.name);
        setYieldUnits(r.yieldUnits);
        setLines(r.lines ?? []);
        setLineItemId('');
        setLineQty(1);
        setOpen(true);
    }

    function addLine() {
        if (!lineItemId) return;
        if (lineQty <= 0) return;

        setLines((prev) => [
            ...prev,
            { itemId: lineItemId, qty: Math.max(1, Math.floor(lineQty)), unidadMedida: unitM },
        ]);

        setLineItemId('');
        setLineQty(1);
    }

    function removeLineAt(index: number) {
        setLines((prev) => prev.filter((_, i) => i !== index));
    }

    function itemNameById(id: string) {
        return inventory.find((i) => i.id === id)?.name ?? 'Insumo eliminado';
    }

    async function save() {
        if (!name.trim()) return;
        if (yieldUnits <= 0) return;

        await upsertRecipe(
            {
                name: name.trim(),
                yieldUnits: Math.max(1, Math.floor(yieldUnits)),
                lines,
            },
            editingId
        );

        setOpen(false);
        await load();
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="end">
                        <IonButton size="large" color="primary" onClick={openCreate}>
                            + NUEVA
                        </IonButton>
                    </IonButtons>

                    <IonTitle className="ion-text-center">
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                            <span style={{ fontSize: 20, fontWeight: 800 }}>DulceStock</span>
                            <span style={{ fontSize: 13, opacity: 0.7, fontWeight: 500 }}>
                                Recetas
                            </span>
                        </div>
                    </IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <IonSearchbar
                    value={query}
                    placeholder="Buscar receta..."
                    onIonInput={(e) => setQuery(String(e.detail.value ?? ''))}
                    style={{ marginBottom: 10 }}
                />

                {filteredRecipes.length === 0 && (
                    <p style={{ opacity: 0.7 }}>
                        No hay recetas. Pulsa <strong>+ NUEVA</strong> para crear la primera.
                    </p>
                )}

                {filteredRecipes.map((r) => {
                    const c = calcRecipeCost(r, inventory);

                    return (
                        <IonCard
                            key={r.id}
                            button
                            onClick={() => openEdit(r.id)}
                            style={{
                                borderRadius: 14,
                                boxShadow: '0 6px 18px rgba(0,0,0,0.10)',
                                marginBottom: 14,
                            }}
                        >
                            <IonCardContent>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: 12,
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: 16, opacity: 0.75 }}>
                                            {r.name}
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                                            <IonChip color="primary">
                                                Rinde: {r.yieldUnits} u
                                            </IonChip>

                                            <IonChip color="success">
                                                Costo lote: ${c.totalCost.toFixed(2)}
                                            </IonChip>

                                            <IonChip color="tertiary">
                                                Costo/u: ${c.unitCost.toFixed(2)}
                                            </IonChip>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                                        <IonButton
                                            size="small"
                                            fill="solid"
                                            color="medium"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openEdit(r.id);
                                            }}
                                        >
                                            <IonIcon icon={pencil} />
                                        </IonButton>

                                        <IonButton
                                            size="small"
                                            fill="solid"
                                            color="danger"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDeleteId(r.id);
                                            }}
                                        >
                                            <IonIcon icon={trash} />
                                        </IonButton>
                                    </div>
                                </div>
                            </IonCardContent>
                        </IonCard>
                    );
                })}

                <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>{editingRecipe ? 'Editar receta' : 'Nueva receta'}</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setOpen(false)}>Cerrar</IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>

                    <IonContent className="ion-padding">
                        <IonItem>
                            <IonLabel position="stacked">Nombre</IonLabel>
                            <IonInput
                                value={name}
                                onIonInput={(e) => setName(String(e.detail.value ?? ''))}
                            />
                        </IonItem>

                        <IonItem>
                            <IonLabel position="stacked">Rinde (unidades por lote)</IonLabel>
                            <IonInput
                                type="number"
                                value={yieldUnits}
                                onIonInput={(e) => setYieldUnits(Math.max(1, toNumber(e.detail.value, 1)))}
                            />
                        </IonItem>

                        <div style={{ marginTop: 16 }}>
                            <IonLabel>
                                <strong>Ingredientes (por 1 lote)</strong>
                            </IonLabel>

                            <IonItem>
                                <IonLabel position="stacked">Insumo</IonLabel>
                                <IonSelect
                                    value={lineItemId}
                                    interface="popover"
                                    placeholder="Selecciona un insumo"
                                    onIonChange={(e) => setLineItemId(String(e.detail.value))}
                                >
                                    {[...inventory]
                                        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
                                        .map((i) => (
                                            <IonSelectOption key={i.id} value={i.id}>
                                                {i.name} (stock {i.stock})
                                            </IonSelectOption>
                                        ))}
                                </IonSelect>
                            </IonItem>

                            <IonItem>
                                <IonLabel position="stacked">Cantidad</IonLabel>
                                <IonInput
                                    type="number"
                                    placeholder='Ingrese la cantidad en gramos o mililitros'
                                    value={lineQty}
                                    onIonInput={(e) => setLineQty(Math.max(1, toNumber(e.detail.value, 1)))}
                                />
                            </IonItem>

                            <IonItem>
                                <IonLabel position="stacked">Unidad de medida de la cantidad</IonLabel>
                                <IonSelect
                                    value={unitM}
                                    placeholder="Selecciona unidad"
                                    onIonChange={e => setUnitM(e.detail.value)}
                                >
                                    <IonSelectOption value="gr">Gramos (gr)</IonSelectOption>
                                    <IonSelectOption value="ml">Mililitros (ml)</IonSelectOption>
                                </IonSelect>
                            </IonItem>

                            <IonButton expand="block" onClick={addLine} style={{ marginTop: 10 }}>
                                <IonIcon icon={add} style={{ marginRight: 8 }} />
                                Agregar ingrediente
                            </IonButton>

                            <IonList style={{ marginTop: 10 }}>
                                {lines.map((ln, idx) => (
                                    <IonItem key={`${ln.itemId}-${idx}`}>
                                        <IonLabel>
                                            {itemNameById(ln.itemId)} · {ln.qty} {ln.unidadMedida}
                                        </IonLabel>
                                        <IonButton color="danger" onClick={() => removeLineAt(idx)}>
                                            Quitar
                                        </IonButton>
                                    </IonItem>
                                ))}
                            </IonList>
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <IonButton expand="block" onClick={save}>
                                Guardar receta
                            </IonButton>
                        </div>
                    </IonContent>
                </IonModal>

                <IonAlert
                    isOpen={!!deleteId}
                    header="Eliminar receta"
                    message="¿Seguro que deseas eliminar esta receta?"
                    buttons={[
                        { text: 'Cancelar', role: 'cancel', handler: () => setDeleteId(null) },
                        {
                            text: 'Eliminar',
                            role: 'destructive',
                            handler: async () => {
                                if (deleteId) await removeRecipe(deleteId);
                                setDeleteId(null);
                                load();
                            },
                        },
                    ]}
                    onDidDismiss={() => setDeleteId(null)}
                />
            </IonContent>
        </IonPage>
    );
}
