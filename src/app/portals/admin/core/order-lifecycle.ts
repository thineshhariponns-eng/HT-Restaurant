import type { Order, OrderStatus, OrderType } from './models/order';

/**
 * The order lifecycle shared with the customer app (DEMO branch):
 * delivery  Pending → Confirmed → Preparing → Ready → Out for Delivery → Delivered
 * pickup    Pending → Confirmed → Preparing → Ready → Picked Up
 * Rejected and Cancelled end either type.
 */
export const LIFECYCLE: Record<OrderType, OrderStatus[]> = {
  delivery: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered'],
  pickup: ['pending', 'confirmed', 'preparing', 'ready', 'picked-up'],
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'New',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  'out-for-delivery': 'Out for delivery',
  delivered: 'Delivered',
  'picked-up': 'Picked up',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

/** Which status hue the marker dot takes. Labels stay neutral (Marker-Carries-Color rule). */
export type StatusTone = 'attention' | 'kitchen' | 'delivery' | 'done' | 'stopped';

export function statusTone(status: OrderStatus): StatusTone {
  switch (status) {
    case 'pending':
      return 'attention';
    case 'confirmed':
    case 'preparing':
    case 'ready':
      return 'kitchen';
    case 'out-for-delivery':
      return 'delivery';
    case 'delivered':
    case 'picked-up':
      return 'done';
    case 'rejected':
    case 'cancelled':
      return 'stopped';
  }
}

export function isTerminal(status: OrderStatus): boolean {
  return ['delivered', 'picked-up', 'rejected', 'cancelled'].includes(status);
}

export function isActive(status: OrderStatus): boolean {
  return !isTerminal(status);
}

export function nextStatus(order: Pick<Order, 'type' | 'status'>): OrderStatus | null {
  const steps = LIFECYCLE[order.type];
  const index = steps.indexOf(order.status);
  if (index === -1 || index === steps.length - 1) return null;
  return steps[index + 1];
}

/** The button label for moving an order to its next status. */
export function advanceLabel(order: Pick<Order, 'type' | 'status'>): string | null {
  switch (order.status) {
    case 'pending':
      return 'Accept';
    case 'confirmed':
      return 'Start preparing';
    case 'preparing':
      return 'Mark ready';
    case 'ready':
      return order.type === 'delivery' ? 'Send out' : 'Mark picked up';
    case 'out-for-delivery':
      return 'Mark delivered';
    default:
      return null;
  }
}

/** A new order is rejected; an accepted one is cancelled. Neither is possible once it has left. */
export function stopAction(status: OrderStatus): 'reject' | 'cancel' | null {
  if (status === 'pending') return 'reject';
  if (status === 'confirmed' || status === 'preparing' || status === 'ready') return 'cancel';
  return null;
}

export const STOP_REASONS: Record<'reject' | 'cancel', string[]> = {
  reject: [
    'Kitchen at capacity',
    'Item sold out',
    'Outside delivery area',
    'Closing soon',
    'Other',
  ],
  cancel: ['Customer asked to cancel', 'Item sold out', 'Rider unavailable', 'Other'],
};
