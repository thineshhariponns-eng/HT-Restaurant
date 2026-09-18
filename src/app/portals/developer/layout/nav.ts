export interface NavLink {
  path: string;
  label: string;
}

export interface NavGroup {
  label: string;
  links: NavLink[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Delivery',
    links: [
      { path: '/developer/dashboard', label: 'Dashboard' },
      { path: '/developer/clients', label: 'Clients' },
      { path: '/developer/onboarding', label: 'Onboarding' },
    ],
  },
  {
    label: 'Infrastructure',
    links: [
      { path: '/developer/domains', label: 'Domains' },
      { path: '/developer/deployments', label: 'Deployments' },
    ],
  },
];
