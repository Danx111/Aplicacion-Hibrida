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
    IonTitle,
    IonToolbar,
} from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import { InventoryItem } from '../../models/inventory';
import {
    adjustStock,
    listInventory,
    removeInventory,
    upsertInventory,
} from '../../services/inventoryService';

function toNumber(v: any, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | undefined>(undefined);

    const [name, setName] = useState('');
    const [stock, setStock] = useState<number>(0);
    const [unitCost, setUnitCost] = useState<number>(0);

    const [deleteId, setDeleteId] = useState<string | null>(null);

    async function load() {
        setItems(await listInventory());
    }

    useEffect(() => {
        load();
    }, []);

    const editingItem = useMemo(
        () => items.find((i) => i.id === editingId),
        [items, editingId]
    );

    function openCreate() {
        setEditingId(undefined);
        setName('');
        setStock(0);
        setUnitCost(0);
        setOpen(true);
    }

    function openEdit(id: string) {
        const it = items.find((x) => x.id === id);
        if (!it) return;
        setEditingId(id);
        setName(it.name);
        setStock(it.stock);
        setUnitCost(it.unitCost);
        setOpen(true);
    }

    async function save() {
        if (!name.trim()) return;

        await upsertInventory(
            { name: name.trim(), stock: Math.max(0, stock), unitCost: Math.max(0, unitCost) },
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
                            + AGREGAR
                        </IonButton>
                    </IonButtons>

                    <IonTitle className="ion-text-center">
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                            <span style={{ fontSize: 20, fontWeight: 800 }}>DulceStock</span>
                            <span style={{ fontSize: 13, opacity: 0.7, fontWeight: 500 }}>
                                Inventario (Unidades)
                            </span>
                        </div>
                    </IonTitle>
                </IonToolbar>
            </IonHeader>


            <IonContent className="ion-padding">
                {items.length === 0 && (
                    <p style={{ opacity: 0.7 }}>
                        Aún no tienes insumos. Pulsa <strong>+ AGREGAR</strong> para crear el primero.
                    </p>
                )}

                <IonList>
                    {items.map((i) => (
                        <IonItem key={i.id} button onClick={() => openEdit(i.id)}>
                            <IonLabel>
                                <h2>{i.name}</h2>
                                <p>
                                    Stock: {i.stock} u · Costo/u: ${i.unitCost.toFixed(2)}
                                </p>
                            </IonLabel>

                            <IonButton
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    await adjustStock(i.id, +1);
                                    load();
                                }}
                            >
                                +1
                            </IonButton>

                            <IonButton
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    await adjustStock(i.id, -1);
                                    load();
                                }}
                            >
                                -1
                            </IonButton>

                            <IonButton
                                color="danger"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDeleteId(i.id);
                                }}
                            >
                                Borrar
                            </IonButton>
                        </IonItem>
                    ))}
                </IonList>

                <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>{editingItem ? 'Editar insumo' : 'Nuevo insumo'}</IonTitle>
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
                            <IonLabel position="stacked">Stock (unidades)</IonLabel>
                            <IonInput
                                type="number"
                                value={stock}
                                onIonInput={(e) =>
                                    setStock(Math.max(0, toNumber(e.detail.value, 0)))
                                }
                            />
                        </IonItem>

                        <IonItem>
                            <IonLabel position="stacked">Costo por unidad ($)</IonLabel>
                            <IonInput
                                type="number"
                                value={unitCost}
                                onIonInput={(e) =>
                                    setUnitCost(Math.max(0, toNumber(e.detail.value, 0)))
                                }
                            />
                        </IonItem>

                        <div style={{ marginTop: 16 }}>
                            <IonButton expand="block" onClick={save}>
                                Guardar
                            </IonButton>
                        </div>
                    </IonContent>
                </IonModal>

                <IonAlert
                    isOpen={!!deleteId}
                    header="Eliminar insumo"
                    message="¿Seguro que deseas eliminar este insumo?"
                    buttons={[
                        { text: 'Cancelar', role: 'cancel', handler: () => setDeleteId(null) },
                        {
                            text: 'Eliminar',
                            role: 'destructive',
                            handler: async () => {
                                if (deleteId) await removeInventory(deleteId);
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
