import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Menu } from './pages/menu/menu';
import { MenuItemDetail } from './pages/menu-item-detail/menu-item-detail';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { OrderConfirmation } from './pages/order-confirmation/order-confirmation';
import { OrderHistory } from './pages/order-history/order-history';
import { OrderDetails } from './pages/order-details/order-details';

export const routes: Routes = [
  { path: '', component: Home, title: 'HT Restaurant Erode' },
  { path: 'menu', component: Menu, title: 'Menu — HT Restaurant Erode' },
  { path: 'menu/:slug', component: MenuItemDetail, title: 'HT Restaurant Erode' },
  { path: 'cart', component: Cart, title: 'Your Cart — HT Restaurant Erode' },
  { path: 'checkout', component: Checkout, title: 'Checkout — HT Restaurant Erode' },
  { path: 'order-confirmation', component: OrderConfirmation, title: 'Order Confirmed — HT Restaurant Erode' },
  { path: 'orders', component: OrderHistory, title: 'My Orders — HT Restaurant Erode' },
  { path: 'orders/:orderNumber', component: OrderDetails, title: 'Order Status — HT Restaurant Erode' }
];
