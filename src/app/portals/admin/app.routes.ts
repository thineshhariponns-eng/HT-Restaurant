import { Routes } from '@angular/router';
import { AdminShell } from './layout/admin-shell/admin-shell';

const SUFFIX = ' · HT Restaurant Admin';
const notBuilt = () => import('./features/admin/not-built/not-built').then((m) => m.NotBuilt);

export const routes: Routes = [
  {
    path: '',
    component: AdminShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'orders' },
      {
        path: 'orders',
        title: 'Orders' + SUFFIX,
        data: { label: 'Orders' },
        loadComponent: () => import('./features/admin/orders/orders').then((m) => m.Orders),
      },
      { path: 'dashboard', title: 'Dashboard' + SUFFIX, data: { label: 'Dashboard' }, loadComponent: notBuilt },
      { path: 'menu', title: 'Menu' + SUFFIX, data: { label: 'Menu' }, loadComponent: notBuilt },
      { path: 'staff', title: 'Staff' + SUFFIX, data: { label: 'Staff' }, loadComponent: notBuilt },
      { path: 'customers', title: 'Customers' + SUFFIX, data: { label: 'Customers' }, loadComponent: notBuilt },
      { path: 'reports', title: 'Reports' + SUFFIX, data: { label: 'Reports' }, loadComponent: notBuilt },
      { path: 'settings', title: 'Settings' + SUFFIX, data: { label: 'Settings' }, loadComponent: notBuilt },
      { path: '**', title: 'Not found' + SUFFIX, loadComponent: notBuilt },
    ],
  },
];
