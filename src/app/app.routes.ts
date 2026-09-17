import { Routes } from '@angular/router';

/**
 * Three portals in one app. The customer UI is the product; admin and
 * consultant are doors off to the side, reached by URL, each lazy-loaded so a
 * customer's browser never fetches their code.
 */
export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./portals/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'developer',
    loadChildren: () => import('./portals/developer/developer.routes').then((m) => m.DEVELOPER_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./portals/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
  },
];
