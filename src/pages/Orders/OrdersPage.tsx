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
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
} from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';

import { InventoryItem } from '../../models/inventory';
import { Recipe } from '../../models/recipe';
import { Order, OrderStatus } from '../../models/order';

import { listInventory } from '../../services/inventoryService';
import { listRecipes } from '../../services/recipeService';
import { createOrder, listOrders, removeOrder, updateOrder } from '../../services/orderService';
import { calcRecipeCost, suggestedUnitPrice } from '../../services/costService';
import { getSettings } from '../../services/settingsService';
import { shareText } from '../../utils/share';

function toNumber(v: any, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

export default function OrdersPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [marginPct, setMarginPct] = useState<number>(30);

    const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');

    const [open, setOpen] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [recipeId, setRecipeId] = useState<string>('');
    const [batches, setBatches] = useState<number>(1);

    const [deleteId, setDeleteId] = useState<string | null>(null);

    async function load() {
        const [inv, rec, ord, settings] = await Promise.all([
            listInventory(),
            listRecipes(),
            listOrders(),
            getSettings(),
        ]);
        setInventory(inv);
        setRecipes(rec);
        setOrders(ord);
        setMarginPct(settings.marginPct);
    }

    useEffect(() => {
        load();
    }, []);

    const filteredOrders = useMemo(() => {
        const base = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

        return [...base].sort((a, b) =>
            a.customerName.localeCompare(b.customerName, 'es', { sensitivity: 'base' })
        );
    }, [orders, filter]);


    function recipeById(id: string) {
        return recipes.find(r => r.id === id);
    }

    async function openCreate() {
        await load();
        setCustomerName('');
        setRecipeId('');
        setBatches(1);
        setOpen(true);
    }


    async function saveOrder() {
        if (!customerName.trim()) return;
        if (!recipeId) return;
        if (batches <= 0) return;

        await createOrder({
            customerName: customerName.trim(),
            recipeId,
            batches: Math.max(1, Math.floor(batches)),
            status: 'PENDING',
        });

        setOpen(false);
        await load();
    }

    async function toggleStatus(o: Order) {
        const next: OrderStatus = o.status === 'PENDING' ? 'DELIVERED' : 'PENDING';
        await updateOrder(o.id, { status: next });
        load();
    }

    async function shareOrder(o: Order) {
        const r = recipeById(o.recipeId);
        if (!r) return;

        const cost = calcRecipeCost(r, inventory);
        const unitPrice = suggestedUnitPrice(cost.unitCost, marginPct);

        const totalUnits = r.yieldUnits * o.batches;
        const totalSuggested = unitPrice * totalUnits;

        const text = `🍪 Pedido - Cookie-Log
Cliente: ${o.customerName}
Producto: ${r.name}
Cantidad: ${totalUnits} unidades (${o.batches} lote/s)

Costo aprox por unidad: $${cost.unitCost.toFixed(2)}
Precio sugerido (margen ${marginPct}%): $${unitPrice.toFixed(2)} c/u
Total sugerido: $${totalSuggested.toFixed(2)}

Estado: ${o.status === 'PENDING' ? 'Pendiente' : 'Entregado'}
`;

        await shareText('Pedido Cookie-Log', text);
    }

    function formatDate(ts: number) {
        try {
            return new Date(ts).toLocaleString();
        } catch {
            return '';
        }
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="end">
                        <IonButton size="large" color="primary" onClick={openCreate}>
                            + NUEVO
                        </IonButton>
                    </IonButtons>

                    <IonTitle className="ion-text-center">
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                            <span style={{ fontSize: 20, fontWeight: 800 }}>DulceStock</span>
                            <span style={{ fontSize: 13, opacity: 0.7, fontWeight: 500 }}>
                                Pedidos
                            </span>
                        </div>
                    </IonTitle>
                </IonToolbar>
            </IonHeader>


            <IonContent className="ion-padding">
                <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as any)}>
                    <IonSegmentButton value="ALL"><IonLabel>Todos</IonLabel></IonSegmentButton>
                    <IonSegmentButton value="PENDING"><IonLabel>Pendientes</IonLabel></IonSegmentButton>
                    <IonSegmentButton value="DELIVERED"><IonLabel>Entregados</IonLabel></IonSegmentButton>
                </IonSegment>

                <IonList>
                    {filteredOrders.map(o => {
                        const r = recipeById(o.recipeId);
                        const totalUnits = r ? r.yieldUnits * o.batches : 0;

                        return (
                            <IonItem key={o.id}>
                                <IonLabel>
                                    <h2>{o.customerName}</h2>
                                    <p>{r ? r.name : 'Receta eliminada'} · {totalUnits} u</p>
                                    <p>Estado: {o.status} · {formatDate(o.createdAt)}</p>
                                </IonLabel>

                                <IonButton onClick={() => toggleStatus(o)}>
                                    {o.status === 'PENDING' ? 'Entregado' : 'Pendiente'}
                                </IonButton>

                                <IonButton onClick={() => shareOrder(o)}>
                                    Compartir
                                </IonButton>

                                <IonButton color="danger" onClick={() => setDeleteId(o.id)}>
                                    Borrar
                                </IonButton>
                            </IonItem>
                        );
                    })}
                </IonList>

                <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Nuevo pedido</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setOpen(false)}>Cerrar</IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>

                    <IonContent className="ion-padding">
                        <IonItem>
                            <IonLabel position="stacked">Nombre del cliente</IonLabel>
                            <IonInput
                                value={customerName}
                                placeholder="Ej: María Pérez"
                                onIonInput={(e) => setCustomerName(String(e.detail.value ?? ''))}
                            />
                        </IonItem>


                        <IonItem>
                            <IonLabel position="stacked">Receta</IonLabel>
                            <IonSelect
                                value={recipeId}
                                placeholder="Selecciona una receta"
                                onIonChange={(e) => setRecipeId(String(e.detail.value))}
                            >
                                {[...recipes].sort((a, b) => a.name.localeCompare(b.name)).map(r => (
                                    <IonSelectOption key={r.id} value={r.id}>
                                        {r.name} (rinde {r.yieldUnits} u)
                                    </IonSelectOption>
                                ))}
                            </IonSelect>
                        </IonItem>

                        <IonItem>
                            <IonLabel position="stacked">Lotes (batches)</IonLabel>
                            <IonInput
                                type="number"
                                value={batches}
                                onIonInput={(e) => setBatches(Math.max(1, toNumber(e.detail.value, 1)))}
                            />
                        </IonItem>

                        <div style={{ marginTop: 16 }}>
                            <IonButton expand="block" onClick={saveOrder}>
                                Guardar pedido
                            </IonButton>
                        </div>
                    </IonContent>
                </IonModal>

                <IonAlert
                    isOpen={!!deleteId}
                    header="Eliminar pedido"
                    message="¿Seguro que deseas eliminar este pedido?"
                    buttons={[
                        { text: 'Cancelar', role: 'cancel', handler: () => setDeleteId(null) },
                        {
                            text: 'Eliminar',
                            role: 'destructive',
                            handler: async () => {
                                if (deleteId) await removeOrder(deleteId);
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
