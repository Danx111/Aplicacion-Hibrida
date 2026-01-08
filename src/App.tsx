import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { list, calculator, cart, settingsOutline } from 'ionicons/icons';

import InventoryPage from './pages/Inventory/InventoryPage';
import RecipesPage from './pages/Recipes/RecipesPage';
import OrdersPage from './pages/Orders/OrdersPage';
import SettingsPage from './pages/Settings/SettingsPage';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/inventory" component={InventoryPage} />
          <Route exact path="/recipes" component={RecipesPage} />
          <Route exact path="/orders" component={OrdersPage} />
          <Route exact path="/settings" component={SettingsPage} />

          <Route exact path="/">
            <Redirect to="/inventory" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom">
          <IonTabButton tab="inventory" href="/inventory">
            <IonIcon aria-hidden="true" icon={list} />
            <IonLabel>Inventario</IonLabel>
          </IonTabButton>

          <IonTabButton tab="recipes" href="/recipes">
            <IonIcon aria-hidden="true" icon={calculator} />
            <IonLabel>Recetas</IonLabel>
          </IonTabButton>

          <IonTabButton tab="orders" href="/orders">
            <IonIcon aria-hidden="true" icon={cart} />
            <IonLabel>Pedidos</IonLabel>
          </IonTabButton>

          <IonTabButton tab="settings" href="/settings">
            <IonIcon aria-hidden="true" icon={settingsOutline} />
            <IonLabel>Ajustes</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
);

export default App;
