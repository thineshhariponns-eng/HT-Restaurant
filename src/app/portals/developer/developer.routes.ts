import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Routes } from '@angular/router';
import { ClientsStore } from './core/services/clients-store';
import { PlatformShell } from './layout/platform-shell/platform-shell';

const SUFFIX = ' · HT Restaurant Platform';
const notBuilt = () => import('./features/not-built/not-built').then((m) => m.NotBuilt);

/** "Spice Garden details", or a plain fallback when the id is unknown. */
function clientTitle(route: ActivatedRouteSnapshot): string {
  const client = inject(ClientsStore).byId(route.paramMap.get('id') ?? '');
  return (client ? `${client.name} details` : 'Client not found') + SUFFIX;
}

export const DEVELOPER_ROUTES: Routes = [
  {
    path: '',
    component: PlatformShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard' + SUFFIX,
        data: { label: 'Dashboard' },
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'clients',
        title: 'Clients' + SUFFIX,
        data: { label: 'Clients' },
        loadComponent: () => import('./features/clients/clients').then((m) => m.Clients),
      },
      {
        path: 'clients/:id',
        title: clientTitle,
        data: { label: 'Client details' },
        loadComponent: () =>
          import('./features/clients/client-detail/client-detail').then((m) => m.ClientDetail),
      },
      { path: 'clients/:id/edit', title: 'Edit client' + SUFFIX, data: { label: 'Edit client' }, loadComponent: notBuilt },
      {
        path: 'onboarding',
        title: 'Onboarding' + SUFFIX,
        data: { label: 'Onboarding' },
        loadComponent: () => import('./features/onboarding/onboarding').then((m) => m.Onboarding),
      },
      { path: 'domain', pathMatch: 'full', redirectTo: 'domains' },
      {
        path: 'domains',
        title: 'Domains' + SUFFIX,
        data: { label: 'Domains' },
        loadComponent: () => import('./features/domains/domains').then((m) => m.Domains),
      },
      {
        path: 'deployments',
        title: 'Deployments' + SUFFIX,
        data: { label: 'Deployments' },
        loadComponent: () => import('./features/deployments/deployments').then((m) => m.Deployments),
      },
      { path: '**', title: 'Not found' + SUFFIX, loadComponent: notBuilt },
    ],
  },
];
