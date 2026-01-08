import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../../services/settingsService';

function toNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function SettingsPage() {
  const [marginPct, setMarginPct] = useState<number>(30);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setMarginPct(s.marginPct);
    })();
  }, []);

  async function save() {
    await saveSettings({ marginPct: Math.max(0, toNumber(marginPct, 0)) });
    alert('Ajustes guardados ✅');
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ajustes</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Margen por defecto (%)</IonLabel>
          <IonInput
            type="number"
            value={marginPct}
            onIonInput={(e) => setMarginPct(toNumber(e.detail.value, 0))}
          />
        </IonItem>

        <div style={{ marginTop: 16 }}>
          <IonButton expand="block" onClick={save}>
            Guardar
          </IonButton>
        </div>

        <p style={{ marginTop: 12, opacity: 0.8 }}>
          Este margen se usa para sugerir el precio en los pedidos.
        </p>
      </IonContent>
    </IonPage>
  );
}
