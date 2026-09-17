export type OrderType = 'delivery' | 'pickup';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out-for-delivery'
  | 'delivered'
  | 'picked-up'
  | 'rejected'
  | 'cancelled';

export type PaymentMethod = 'online' | 'cash';

export interface OrderLine {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface StatusEvent {
  status: OrderStatus;
  /** ISO 8601 timestamp. */
  at: string;
  note?: string;
}

export interface Order {
  number: string;
  type: OrderType;
  status: OrderStatus;
  /** ISO 8601 timestamp. */
  placedAt: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  /** Delivery orders only. */
  address?: string;
  notes?: string;
  payment: PaymentMethod;
  lines: OrderLine[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  history: StatusEvent[];
}
