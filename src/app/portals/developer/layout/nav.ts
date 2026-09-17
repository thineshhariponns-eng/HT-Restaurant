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
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/clients', label: 'Clients' },
      { path: '/onboarding', label: 'Onboarding' },
    ],
  },
  {
    label: 'Infrastructure',
    links: [
      { path: '/domains', label: 'Domains' },
      { path: '/deployments', label: 'Deployments' },
    ],
  },
];
