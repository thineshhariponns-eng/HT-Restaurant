import type { Order } from '../services/order';
import type { OrderType } from '../shared/order-type-selector/order-type-selector';
import { DELIVERY_ETA_MINUTES, PICKUP_READY_MINUTES } from '../services/order';

const MOCK_LINES = [
  { slug: 'chicken-biryani', name: 'Chicken Biryani', price: 280, quantity: 2 },
  { slug: 'lime-juice', name: 'Lime Juice', price: 58, quantity: 1 }
];

/** Mock orders — preview only. Items, customer and address are synthetic. */
export const MOCK_ORDERS: Record<OrderType, Order> = {
  pickup: {
    orderNumber: 'HT202609140001',
    type: 'pickup',
    status: 'confirmed',
    placedAt: '2026-09-14T19:15:00+05:30',
    readyInMinutes: PICKUP_READY_MINUTES,
    customer: { name: 'Arun K.', phone: '9876501234', email: 'arun@example.com' },
    notes: '',
    lines: MOCK_LINES,
    subtotal: 618,
    tax: 31,
    deliveryFee: 0,
    total: 649
  },
  delivery: {
    orderNumber: 'HT202609140002',
    type: 'delivery',
    status: 'confirmed',
    placedAt: '2026-09-14T19:15:00+05:30',
    readyInMinutes: DELIVERY_ETA_MINUTES,
    customer: { name: 'Priya S.', phone: '9876505678', email: 'priya@example.com' },
    deliveryAddress: { address: '12, Gandhiji Road, Near Clock Tower', city: 'Erode', postalCode: '638001' },
    notes: 'Less spicy, please.',
    lines: MOCK_LINES,
    subtotal: 618,
    tax: 31,
    deliveryFee: 40,
    total: 689
  }
};
