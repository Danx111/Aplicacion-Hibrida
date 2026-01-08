import {
    IonAlert,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
} from '@ionic/react';
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

    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | undefined>(undefined);

    const [name, setName] = useState('');
    const [yieldUnits, setYieldUnits] = useState<number>(12);
    const [lines, setLines] = useState<RecipeLine[]>([]);

    const [lineItemId, setLineItemId] = useState<string>('');
    const [lineQty, setLineQty] = useState<number>(1);

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
        () => recipes.find(r => r.id === editingId),
        [recipes, editingId]
    );

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

        const r = recipes.find(x => x.id === id);
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

        setLines(prev => [...prev, { itemId: lineItemId, qty: Math.max(1, Math.floor(lineQty)) }]);
        setLineItemId('');
        setLineQty(1);
    }

    function removeLineAt(index: number) {
        setLines(prev => prev.filter((_, i) => i !== index));
    }

    function itemNameById(id: string) {
        return inventory.find(i => i.id === id)?.name ?? 'Insumo eliminado';
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
                <IonList>
                    {recipes.map(r => {
                        const c = calcRecipeCost(r, inventory);
                        return (
                            <IonItem key={r.id} button onClick={() => openEdit(r.id)}>
                                <IonLabel>
                                    <h2>{r.name}</h2>
                                    <p>
                                        Rinde: {r.yieldUnits} u · Costo lote: ${c.totalCost.toFixed(2)} · Costo/u: $
                                        {c.unitCost.toFixed(2)}
                                    </p>
                                </IonLabel>

                                <IonButton
                                    color="danger"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeleteId(r.id);
                                    }}
                                >
                                    Borrar
                                </IonButton>
                            </IonItem>
                        );
                    })}
                </IonList>

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
                            <IonInput value={name} onIonInput={(e) => setName(String(e.detail.value ?? ''))} />
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
                                    {[...inventory].sort((a, b) => a.name.localeCompare(b.name)).map(i => (
                                        <IonSelectOption key={i.id} value={i.id}>
                                            {i.name} (stock {i.stock})
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>

                            <IonItem>
                                <IonLabel position="stacked">Cantidad (unidades)</IonLabel>
                                <IonInput
                                    type="number"
                                    value={lineQty}
                                    onIonInput={(e) => setLineQty(Math.max(1, toNumber(e.detail.value, 1)))}
                                />
                            </IonItem>

                            <IonButton expand="block" onClick={addLine} style={{ marginTop: 8 }}>
                                + Agregar ingrediente
                            </IonButton>

                            <IonList>
                                {lines.map((ln, idx) => (
                                    <IonItem key={`${ln.itemId}-${idx}`}>
                                        <IonLabel>
                                            {itemNameById(ln.itemId)} · {ln.qty} u
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
