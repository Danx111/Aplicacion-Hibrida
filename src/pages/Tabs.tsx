import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { list, calculator, cart, settings } from 'ionicons/icons';

import InventoryPage from './Inventory/InventoryPage';
import RecipesPage from './Recipes/RecipesPage';
import OrdersPage from './Orders/OrdersPage';
import SettingsPage from './Settings/SettingsPage';

const Tabs: React.FC = () => (
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
          <IonIcon aria-hidden="true" icon={settings} />
          <IonLabel>Ajustes</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  </IonReactRouter>
);

export default Tabs;
