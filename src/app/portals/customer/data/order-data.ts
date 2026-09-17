import type { CartLine } from '../services/cart';
import type { DeliveryAddress, MinuteRange, Order, OrderCustomer, OrderStatus } from '../services/order';
import type { OrderType } from '../shared/order-type-selector/order-type-selector';

/**
 * The shipped OrderService only ever produces 'confirmed' | 'preparing' | 'on-the-way' | 'completed'
 * (a placed order starts confirmed). Order tracking additionally needs to represent an order still
 * awaiting the kitchen, and one the restaurant could not fulfil — states the checkout flow never
 * reaches today, so they are modeled here rather than added to the shared OrderStatus union.
 */
export type TrackedStatus = OrderStatus | 'pending' | 'rejected' | 'cancelled';

export interface StatusEvent {
  status: TrackedStatus;
  at: string;
}

export type CancellationReason = 'changed-mind' | 'ordered-by-mistake' | 'taking-too-long' | 'other';

export interface Cancellation {
  reason: CancellationReason;
  note: string;
  /** ISO 8601 timestamp. */
  at: string;
}

export type TrackedOrder = Omit<Order, 'status'> & {
  status: TrackedStatus;
  history: StatusEvent[];
  /** Mock flag for the cancellation demo — whether the customer may still cancel. No rule derives it. */
  cancellable?: boolean;
  cancellation?: Cancellation;
};

export const CANCELLATION_REASONS: CancellationReason[] = ['changed-mind', 'ordered-by-mistake', 'taking-too-long', 'other'];

export function cancellationReasonLabel(reason: CancellationReason, type: OrderType): string {
  switch (reason) {
    case 'changed-mind':
      return 'I changed my mind';
    case 'ordered-by-mistake':
      return 'Ordered by mistake';
    case 'taking-too-long':
      return type === 'delivery' ? 'Delivery is taking too long' : "It's taking too long";
    default:
      return 'Other';
  }
}

const ACTIVE_STATUSES: TrackedStatus[] = ['pending', 'confirmed', 'preparing', 'on-the-way'];

export function isActiveStatus(status: TrackedStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

/** Latest end of the placeholder estimate, as an ISO timestamp. */
export function readyByIso(order: TrackedOrder): string {
  return new Date(Date.parse(order.placedAt) + order.readyInMinutes.max * 60_000).toISOString();
}

/** How the order history groups statuses: still moving, finished, or stopped. */
export type OrderStatusGroup = 'active' | 'completed' | 'cancelled';

const STATUS_GROUPS: Record<TrackedStatus, OrderStatusGroup> = {
  pending: 'active',
  confirmed: 'active',
  preparing: 'active',
  'on-the-way': 'active',
  completed: 'completed',
  rejected: 'cancelled',
  cancelled: 'cancelled'
};

export function orderStatusGroup(status: TrackedStatus): OrderStatusGroup {
  return STATUS_GROUPS[status];
}

export const STEPS_BY_TYPE: Record<OrderType, TrackedStatus[]> = {
  delivery: ['pending', 'confirmed', 'preparing', 'on-the-way', 'completed'],
  pickup: ['pending', 'confirmed', 'preparing', 'on-the-way', 'completed']
};

export const STATUS_COPY: Record<OrderType, Record<TrackedStatus, { label: string; message: string }>> = {
  delivery: {
    pending: { label: 'Pending', message: 'Your order has been received.' },
    confirmed: { label: 'Confirmed', message: 'The restaurant has confirmed your order.' },
    preparing: { label: 'Preparing', message: 'Your food is being prepared.' },
    'on-the-way': { label: 'Out for Delivery', message: 'Your order is on its way.' },
    completed: { label: 'Delivered', message: 'Your order has been delivered.' },
    rejected: { label: 'Rejected', message: "The restaurant couldn't accept this order." },
    cancelled: { label: 'Cancelled', message: 'This order was cancelled.' }
  },
  pickup: {
    pending: { label: 'Pending', message: 'Your order has been received.' },
    confirmed: { label: 'Confirmed', message: 'The restaurant has confirmed your order.' },
    preparing: { label: 'Preparing', message: 'Your food is being prepared.' },
    'on-the-way': { label: 'Ready', message: 'Your order is ready. Collect it at the counter.' },
    completed: { label: 'Picked Up', message: "You've picked up your order." },
    rejected: { label: 'Rejected', message: "The restaurant couldn't accept this order." },
    cancelled: { label: 'Cancelled', message: 'This order was cancelled.' }
  }
};

function customer(name: string, phone: string, email: string): OrderCustomer {
  return { name, phone, email };
}

function address(line: string, city: string, postalCode: string): DeliveryAddress {
  return { address: line, city, postalCode };
}

function lines(...items: CartLine[]): CartLine[] {
  return items;
}

const ETA: MinuteRange = { min: 40, max: 50 };
const PICKUP_ETA: MinuteRange = { min: 25, max: 30 };

/** Mock order-tracking data — no backend yet. Order numbers, customers and timings are placeholders. */
export const MOCK_ORDERS: TrackedOrder[] = [
  {
    orderNumber: 'HT202609150028',
    type: 'pickup',
    status: 'completed',
    placedAt: '2026-09-15T09:15:00+05:30',
    readyInMinutes: PICKUP_ETA,
    customer: customer('Suresh Babu', '9000077788', 'suresh@example.com'),
    notes: '',
    lines: lines(
      { slug: 'veg-dum-biryani', name: 'Veg Dum Biryani', price: 210, quantity: 1 },
      { slug: 'masala-chaas', name: 'Masala Chaas', price: 60, quantity: 1 }
    ),
    subtotal: 270,
    tax: 14,
    deliveryFee: 0,
    total: 284,
    history: [
      { status: 'pending', at: '2026-09-15T09:15:00+05:30' },
      { status: 'confirmed', at: '2026-09-15T09:16:00+05:30' },
      { status: 'preparing', at: '2026-09-15T09:19:00+05:30' },
      { status: 'on-the-way', at: '2026-09-15T09:33:00+05:30' },
      { status: 'completed', at: '2026-09-15T09:41:00+05:30' }
    ]
  },
  {
    orderNumber: 'HT202609150025',
    type: 'delivery',
    status: 'on-the-way',
    placedAt: '2026-09-15T11:10:00+05:30',
    readyInMinutes: ETA,
    customer: customer('Karthik Selvam', '9000022233', 'karthik@example.com'),
    deliveryAddress: address('48 Brindavan Street', 'Erode', '638001'),
    notes: '',
    lines: lines(
      { slug: 'butter-chicken', name: 'Butter Chicken', price: 280, quantity: 1 },
      { slug: 'filter-coffee', name: 'Filter Coffee', price: 50, quantity: 2 }
    ),
    subtotal: 380,
    tax: 19,
    deliveryFee: 40,
    total: 439,
    cancellable: false,
    history: [
      { status: 'pending', at: '2026-09-15T11:10:00+05:30' },
      { status: 'confirmed', at: '2026-09-15T11:12:00+05:30' },
      { status: 'preparing', at: '2026-09-15T11:15:00+05:30' },
      { status: 'on-the-way', at: '2026-09-15T11:38:00+05:30' }
    ]
  },
  {
    orderNumber: 'HT202609150021',
    type: 'delivery',
    status: 'preparing',
    placedAt: '2026-09-15T10:32:00+05:30',
    readyInMinutes: ETA,
    customer: customer('John Doe', '9000033344', 'john@example.com'),
    deliveryAddress: address('123 Main Street', 'Erode', '638001'),
    notes: '',
    lines: lines(
      { slug: 'chicken-biryani', name: 'Chicken Biryani', price: 250, quantity: 2 },
      { slug: 'lime-juice', name: 'Lime Juice', price: 80, quantity: 1 }
    ),
    subtotal: 580,
    tax: 29,
    deliveryFee: 40,
    total: 649,
    cancellable: true,
    history: [
      { status: 'pending', at: '2026-09-15T10:32:00+05:30' },
      { status: 'confirmed', at: '2026-09-15T10:34:00+05:30' },
      { status: 'preparing', at: '2026-09-15T10:38:00+05:30' }
    ]
  },
  {
    orderNumber: 'HT202609150019',
    type: 'delivery',
    status: 'confirmed',
    placedAt: '2026-09-15T10:20:00+05:30',
    readyInMinutes: ETA,
    customer: customer('Meena Kumari', '9000044455', 'meena@example.com'),
    deliveryAddress: address('17 Gandhi Nagar', 'Erode', '638002'),
    notes: '',
    lines: lines({ slug: 'paneer-tikka-masala', name: 'Paneer Tikka Masala', price: 220, quantity: 1 }),
    subtotal: 220,
    tax: 11,
    deliveryFee: 40,
    total: 271,
    cancellable: true,
    history: [
      { status: 'pending', at: '2026-09-15T10:20:00+05:30' },
      { status: 'confirmed', at: '2026-09-15T10:22:00+05:30' }
    ]
  },
  {
    orderNumber: 'HT202609150015',
    type: 'delivery',
    status: 'pending',
    placedAt: '2026-09-15T10:05:00+05:30',
    readyInMinutes: ETA,
    customer: customer('Arun Prasath', '9000055566', 'arun@example.com'),
    deliveryAddress: address('9 Sathy Road', 'Erode', '638003'),
    notes: '',
    lines: lines({ slug: 'mutton-kondattam-biryani', name: 'Mutton Kondattam Biryani', price: 320, quantity: 1 }),
    subtotal: 320,
    tax: 16,
    deliveryFee: 40,
    total: 376,
    cancellable: true,
    history: [{ status: 'pending', at: '2026-09-15T10:05:00+05:30' }]
  },
  {
    orderNumber: 'HT202609150003',
    type: 'delivery',
    status: 'rejected',
    placedAt: '2026-09-15T09:00:00+05:30',
    readyInMinutes: ETA,
    customer: customer('Lakshmi Narayan', '9000088899', 'lakshmi@example.com'),
    deliveryAddress: address('76 Bhavani Road', 'Erode', '638004'),
    notes: '',
    lines: lines({ slug: 'pepper-chicken-dry', name: 'Pepper Chicken Dry', price: 240, quantity: 2 }),
    subtotal: 480,
    tax: 24,
    deliveryFee: 40,
    total: 544,
    history: [
      { status: 'pending', at: '2026-09-15T09:00:00+05:30' },
      { status: 'rejected', at: '2026-09-15T09:04:00+05:30' }
    ]
  },
  {
    orderNumber: 'HT202609141958',
    type: 'delivery',
    status: 'cancelled',
    placedAt: '2026-09-14T19:58:00+05:30',
    readyInMinutes: ETA,
    customer: customer('Ganesh Iyer', '9000099900', 'ganesh@example.com'),
    deliveryAddress: address('5 Collector Office Road', 'Erode', '638005'),
    notes: '',
    lines: lines({ slug: 'erode-karuveppilai-sadam', name: 'Erode Karuveppilai Sadam', price: 160, quantity: 1 }),
    subtotal: 160,
    tax: 8,
    deliveryFee: 40,
    total: 208,
    cancellation: { reason: 'ordered-by-mistake', note: '', at: '2026-09-14T20:06:00+05:30' },
    history: [
      { status: 'pending', at: '2026-09-14T19:58:00+05:30' },
      { status: 'confirmed', at: '2026-09-14T20:00:00+05:30' },
      { status: 'cancelled', at: '2026-09-14T20:06:00+05:30' }
    ]
  }
];
