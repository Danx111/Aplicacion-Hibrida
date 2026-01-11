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
import { add, remove, trash } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';

import { InventoryItem } from '../../models/inventory';
import {
  adjustStock,
  listInventory,
  removeInventory,
  upsertInventory,
  stockReal,
  INVENTORY_UPDATED_EVENT,
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
  const [contNeto, setContNeto] = useState<number>(0);
  const [unit, setUnit] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  async function load() {
    setItems(await listInventory());
  }

  useEffect(() => {
    load();

    const onInvUpdate = () => load();
    window.addEventListener(INVENTORY_UPDATED_EVENT, onInvUpdate);

    return () => {
      window.removeEventListener(INVENTORY_UPDATED_EVENT, onInvUpdate);
    };
  }, []);


  const editingItem = useMemo(
    () => items.find((i) => i.id === editingId),
    [items, editingId]
  );

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  function openCreate() {
    setEditingId(undefined);
    setName('');
    setStock(0);
    setUnitCost(0);
    setContNeto(0);
    setUnit('');
    setOpen(true);
  }

  function openEdit(id: string) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    setEditingId(id);
    setName(it.name);
    setStock(it.stock);
    setUnitCost(it.unitCost);
    setContNeto(it.contenidoNeto);
    setUnit(it.unidadContenidoNeto);
    setOpen(true);
  }

  async function save() {
    if (!name.trim()) return;

    const disponible = stockReal(stock, contNeto);

    await upsertInventory(
      {
        name: name.trim(),
        stock: Math.max(0, stock),
        unitCost: Math.max(0, unitCost),
        contenidoNeto: Math.max(0, contNeto),
        unidadContenidoNeto: unit,
        contenidoDisponible: disponible,
      },
      editingId
    );

    setOpen(false);
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
        <IonSearchbar
          value={query}
          onIonInput={(e) => setQuery(String(e.detail.value ?? ''))}
          placeholder="Buscar insumo..."
          debounce={150}
        />

        {items.length === 0 && (
          <p style={{ opacity: 0.7 }}>
            Aún no tienes insumos. Pulsa <strong>+ AGREGAR</strong> para crear el primero.
          </p>
        )}

        {items.length > 0 && visibleItems.length === 0 && (
          <p style={{ opacity: 0.7 }}>No hay resultados para “{query}”.</p>
        )}

        <IonList style={{ background: 'transparent' }}>
          {visibleItems.map((i) => (
            <IonCard key={i.id} style={{ borderRadius: 14 }}>
              <IonCardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openEdit(i.id)}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>
                      {i.name} {i.contenidoNeto} {i.unidadContenidoNeto}
                    </div>

                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <IonChip color="secondary">
                        <IonLabel>
                          <strong>Stock:</strong> {i.contenidoDisponible} {i.unidadContenidoNeto}
                        </IonLabel>
                      </IonChip>

                      <IonChip color="tertiary">
                        <IonLabel>
                          <strong>Costo/u:</strong> ${i.unitCost.toFixed(2)}
                        </IonLabel>
                      </IonChip>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <IonButton
                        size="small"
                        color="primary"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await adjustStock(i.id, 0, +1, 'botonAumenta');
                          
                        }}
                      >
                        <IonIcon slot="icon-only" icon={add} />
                      </IonButton>

                      <IonButton
                        size="small"
                        color="medium"
                        disabled={(i.contenidoDisponible ?? 0) <= 0}   // ✅ AQUÍ
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await adjustStock(i.id, 0, -1, 'botondisminuye');
                          
                        }}
                      >
                        <IonIcon slot="icon-only" icon={remove} />
                      </IonButton>

                    </div>

                    <IonButton
                      size="small"
                      color="danger"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteId(i.id);
                      }}
                    >
                      <IonIcon slot="start" icon={trash} />
                      Borrar
                    </IonButton>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
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
              <IonInput value={name} onIonInput={(e) => setName(String(e.detail.value ?? ''))} />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Stock (unidades)</IonLabel>
              <IonInput
                type="number"
                value={stock}
                onIonInput={(e) => setStock(Math.max(0, toNumber(e.detail.value, 0)))}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">
                Contenido neto por unidad (Ingrese el contenido neteo en gramos o mililitros)
              </IonLabel>
              <IonInput
                type="number"
                placeholder="Ingrese el contenido neteo en gramos o mililitros"
                value={contNeto}
                onIonInput={(e) => setContNeto(Math.max(0, toNumber(e.detail.value, 0)))}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Unidad de Medida</IonLabel>
              <IonSelect
                value={unit}
                placeholder="Selecciona unidad"
                onIonChange={(e) => setUnit(e.detail.value)}
              >
                <IonSelectOption value="gr">Gramos (gr)</IonSelectOption>
                <IonSelectOption value="ml">Mililitros (ml)</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Costo por unidad ($)</IonLabel>
              <IonInput
                type="number"
                value={unitCost}
                onIonInput={(e) => setUnitCost(Math.max(0, toNumber(e.detail.value, 0)))}
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

              },
            },
          ]}
          onDidDismiss={() => setDeleteId(null)}
        />
      </IonContent>
    </IonPage>
  );
}
