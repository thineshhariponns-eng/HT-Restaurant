export interface NavLink {
  path: string;
  label: string;
  icon: string;
  /** Shows the count of new orders waiting for a decision. */
  showPendingCount?: boolean;
}

export interface NavGroup {
  label: string;
  links: NavLink[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    links: [
      { path: '/dashboard', label: 'Dashboard', icon: 'lucideLayoutDashboard' },
      { path: '/orders', label: 'Orders', icon: 'lucideClipboardList', showPendingCount: true },
    ],
  },
  { label: 'Catalog', links: [{ path: '/menu', label: 'Menu', icon: 'lucideUtensilsCrossed' }] },
  {
    label: 'People',
    links: [
      { path: '/staff', label: 'Staff', icon: 'lucideUsers' },
      { path: '/customers', label: 'Customers', icon: 'lucideContact' },
    ],
  },
  { label: 'Insights', links: [{ path: '/reports', label: 'Reports', icon: 'lucideChartColumn' }] },
];

export const SETTINGS_LINK: NavLink = { path: '/settings', label: 'Settings', icon: 'lucideSettings' };
