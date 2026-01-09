import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonPage,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { refreshOutline, saveOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../../services/settingsService';

function toNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function SettingsPage() {
  const [marginPct, setMarginPct] = useState<number>(30);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setMarginPct(s.marginPct);
    })();
  }, []);

  async function save() {
    await saveSettings({ marginPct: Math.max(0, toNumber(marginPct, 0)) });
    setToastOpen(true);
  }

  function reset() {
    setMarginPct(30);
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="end">
            <IonButton
              color="primary"
              fill="solid"
              onClick={save}
              style={{ fontWeight: 700, textTransform: 'uppercase' }}
            >
              Guardar
            </IonButton>
          </IonButtons>


          <IonTitle className="ion-text-center">
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: 20, fontWeight: 800 }}>DulceStock</span>
              <span style={{ fontSize: 13, opacity: 0.7, fontWeight: 500 }}>Ajustes</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <IonCard style={{ borderRadius: 14 }}>
            <IonCardContent>
              <IonItem lines="full">
                <IonLabel position="stacked">Margen por defecto (%)</IonLabel>
                <IonInput
                  type="number"
                  inputmode="decimal"
                  value={marginPct}
                  placeholder="Ej: 30"
                  onIonInput={(e) => setMarginPct(toNumber(e.detail.value, 0))}
                />
              </IonItem>

              <IonNote style={{ display: 'block', marginTop: 10, opacity: 0.8 }}>
                Este margen se usa para calcular el <strong>precio por unidad</strong> y el{' '}
                <strong>total</strong> en los pedidos.
              </IonNote>

              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <IonButton onClick={save}>
                  <IonIcon slot="start" icon={saveOutline} />
                  Guardar
                </IonButton>

                <IonButton fill="outline" onClick={reset}>
                  <IonIcon slot="start" icon={refreshOutline} />
                  Restaurar 30%
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={toastOpen}
          onDidDismiss={() => setToastOpen(false)}
          message="Ajustes guardados ✅"
          duration={1400}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
}
