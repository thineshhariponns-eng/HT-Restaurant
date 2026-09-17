export type StaffRole = 'Manager' | 'Head chef' | 'Cook' | 'Cashier' | 'Delivery rider';

export type StaffStatus = 'active' | 'on-leave' | 'inactive';

export type Shift = 'Morning' | 'Evening' | 'Full day';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  email: string;
  shift: Shift;
  status: StaffStatus;
  /** ISO date (yyyy-mm-dd). */
  joinedOn: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  area: string;
  /** ISO date (yyyy-mm-dd). */
  firstOrderOn: string;
  orderCount: number;
  totalSpent: number;
  /** ISO 8601 timestamp. */
  lastOrderAt: string;
  note: string;
}
