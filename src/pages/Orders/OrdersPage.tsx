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
    IonModal,
    IonPage,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
} from '@ionic/react';
import { checkmarkDone, shareSocial, trash } from 'ionicons/icons';
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

    const [query, setQuery] = useState('');
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

    function recipeById(id: string) {
        return recipes.find((r) => r.id === id);
    }

    const filteredOrders = useMemo(() => {
        const base = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

        const q = query.trim().toLowerCase();
        const searched = !q
            ? base
            : base.filter((o) => {
                const r = recipeById(o.recipeId);
                const recipeName = (r?.name ?? '').toLowerCase();
                return (
                    o.customerName.toLowerCase().includes(q) ||
                    recipeName.includes(q)
                );
            });

        return [...searched].sort((a, b) => {
            const byName = a.customerName.localeCompare(b.customerName, 'es', { sensitivity: 'base' });
            if (byName !== 0) return byName;
            return (b.createdAt ?? 0) - (a.createdAt ?? 0);
        });
    }, [orders, filter, query, recipes]);

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

    async function advanceStatus(o: Order) {
        if (o.status === 'DELIVERED') return;

        const next = nextStatus(o.status);
        await updateOrder(o.id, { status: next });
        await load();
    }

    function nextStatus(status: OrderStatus): OrderStatus {
        switch (status) {
            case 'PENDING':
                return 'IN_PROGRESS';
            case 'IN_PROGRESS':
                return 'DELIVERED';
            default:
                return status;
        }
    }

    function formatDate(ts?: number) {
        if (!ts) return '';
        try {
            return new Date(ts).toLocaleString();
        } catch {
            return '';
        }
    }
    async function shareOrder(o: Order) {
        const r = recipeById(o.recipeId);
        if (!r) return;

        const cost = calcRecipeCost(r, inventory);
        const unitPrice = suggestedUnitPrice(cost.unitCost, marginPct);

        const totalUnits = r.yieldUnits * o.batches;
        const totalPrice = unitPrice * totalUnits;

        const text = `🍪 Pedido - DulceStock
Producto: ${r.name}
Cantidad: ${totalUnits} unidades
Precio por unidad: $${unitPrice.toFixed(2)}
Total: $${totalPrice.toFixed(2)}

Estado: ${o.status === 'PENDING' ? 'Pendiente' : 'Entregado'}
Fecha: ${formatDate(o.createdAt)}
`;

        await shareText('Pedido DulceStock', text);
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
                    <IonSegmentButton value="ALL">
                        <IonLabel>Todos</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="PENDING">
                        <IonLabel>Pendientes</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="IN_PROGRESS">
                        <IonLabel>En proceso</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="DELIVERED">
                        <IonLabel>Entregados</IonLabel>
                    </IonSegmentButton>
                </IonSegment>


                <IonSearchbar
                    value={query}
                    placeholder="Buscar cliente o receta..."
                    onIonInput={(e) => setQuery(String(e.detail.value ?? ''))}
                    style={{ marginTop: 10, marginBottom: 10 }}
                />

                {filteredOrders.length === 0 && (
                    <p style={{ opacity: 0.7 }}>
                        No hay pedidos para mostrar.
                    </p>
                )}

                {filteredOrders.map((o) => {
                    const r = recipeById(o.recipeId);
                    const recipeName = r ? r.name : 'Receta eliminada';
                    const totalUnits = r ? r.yieldUnits * o.batches : 0;

                    return (
                        <IonCard
                            key={o.id}
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
                                        <div style={{ fontWeight: 900, fontSize: 16, opacity: 0.75 }}>
                                            {o.customerName}
                                        </div>

                                        <div style={{ marginTop: 6, opacity: 0.8 }}>
                                            {recipeName} · {totalUnits} u ({o.batches} lote/s)
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                                            <IonChip
                                                color={
                                                    o.status === 'PENDING'
                                                        ? 'warning'
                                                        : o.status === 'IN_PROGRESS'
                                                            ? 'primary'
                                                            : 'success'
                                                }
                                            >
                                                {o.status === 'PENDING'
                                                    ? 'Pendiente'
                                                    : o.status === 'IN_PROGRESS'
                                                        ? 'En proceso'
                                                        : 'Entregado'}
                                            </IonChip>


                                            <IonChip color="medium">
                                                {formatDate(o.createdAt)}
                                            </IonChip>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                                        <IonButton
                                            size="small"
                                            color={
                                                o.status === 'PENDING'
                                                    ? 'warning'
                                                    : o.status === 'IN_PROGRESS'
                                                        ? 'primary'
                                                        : 'success'
                                            }
                                            disabled={o.status === 'DELIVERED'}
                                            onClick={() => advanceStatus(o)}
                                        >
                                            <IonIcon icon={checkmarkDone} />
                                        </IonButton>

                                        <IonButton
                                            size="small"
                                            color="primary"
                                            onClick={() => shareOrder(o)}
                                        >
                                            <IonIcon icon={shareSocial} />
                                        </IonButton>

                                        <IonButton
                                            size="small"
                                            color="danger"
                                            onClick={() => setDeleteId(o.id)}
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
                                {[...recipes]
                                    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
                                    .map((r) => (
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
