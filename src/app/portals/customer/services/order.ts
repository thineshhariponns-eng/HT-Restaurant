import { Injectable, signal } from '@angular/core';
import type { CartLine } from './cart';
import type { OrderType } from '../shared/order-type-selector/order-type-selector';

export type OrderStatus = 'confirmed' | 'preparing' | 'on-the-way' | 'completed';

export interface MinuteRange {
  min: number;
  max: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
}

export interface DeliveryAddress {
  address: string;
  city: string;
  postalCode: string;
}

export interface Order {
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  /** ISO 8601 timestamp. */
  placedAt: string;
  readyInMinutes: MinuteRange;
  customer: OrderCustomer;
  deliveryAddress?: DeliveryAddress;
  notes: string;
  lines: CartLine[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
}

export type PlaceOrderInput = Pick<
  Order,
  'type' | 'customer' | 'deliveryAddress' | 'notes' | 'lines' | 'subtotal' | 'tax' | 'deliveryFee' | 'total'
>;

/** Placeholder estimates until the kitchen supplies real ones. */
export const PICKUP_READY_MINUTES: MinuteRange = { min: 25, max: 30 };
export const DELIVERY_ETA_MINUTES: MinuteRange = { min: 40, max: 50 };

const STORAGE_KEY = 'ht.lastOrder';

/** In-memory order store — no backend yet, so order numbers are a per-session sequence. */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly lastOrderSignal = signal<Order | null>(readStoredOrder());
  readonly lastOrder = this.lastOrderSignal.asReadonly();

  private sequence = 0;

  placeOrder(input: PlaceOrderInput): Order {
    const placedAt = new Date();
    this.sequence += 1;

    const order: Order = {
      ...input,
      lines: input.lines.map((line) => ({ ...line })),
      deliveryAddress: input.type === 'delivery' ? input.deliveryAddress : undefined,
      orderNumber: `HT${datePart(placedAt)}${String(this.sequence).padStart(4, '0')}`,
      status: 'confirmed',
      placedAt: placedAt.toISOString(),
      readyInMinutes: input.type === 'pickup' ? PICKUP_READY_MINUTES : DELIVERY_ETA_MINUTES
    };

    this.lastOrderSignal.set(order);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {
      // Storage unavailable (private mode, blocked); the in-memory copy still serves this session.
    }
    return order;
  }
}

function datePart(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}${month}${day}`;
}

function readStoredOrder(): Order | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}
