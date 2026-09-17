import type { Order, OrderLine, OrderStatus, OrderType, PaymentMethod, StatusEvent } from '../models/order';
import { LIFECYCLE } from '../order-lifecycle';
import { MOCK_ITEMS } from './mock-menu';
import { MOCK_CUSTOMERS } from './mock-people';
import { minutesAgo } from './mock-time';

export const TAX_RATE = 0.05;
export const DELIVERY_FEE = 40;

interface Seed {
  n: number;
  type: OrderType;
  status: OrderStatus;
  /** Minutes since the order was placed. */
  age: number;
  customer: string;
  /** [itemId, quantity] pairs. */
  lines: [string, number][];
  payment?: PaymentMethod;
  notes?: string;
  reason?: string;
}

/** Tonight's sample service, newest first. Every figure is illustrative. */
const SEEDS: Seed[] = [
  { n: 176, type: 'delivery', status: 'pending', age: 2, customer: 'cu-07', lines: [['erode-special-biryani', 2], ['masala-chaas', 2]] },
  { n: 175, type: 'pickup', status: 'pending', age: 4, customer: 'cu-02', lines: [['kothu-parotta', 1], ['fresh-lime-soda', 1]], payment: 'cash' },
  { n: 174, type: 'delivery', status: 'pending', age: 7, customer: 'cu-10', lines: [['butter-chicken', 1], ['butter-naan', 4], ['gulab-jamun', 1]], notes: 'Gate code 2214. Call on arrival.' },
  { n: 173, type: 'delivery', status: 'confirmed', age: 9, customer: 'cu-06', lines: [['veg-dum-biryani', 1], ['gobi-65', 1]] },
  { n: 172, type: 'pickup', status: 'preparing', age: 12, customer: 'cu-12', lines: [['chettinad-chicken-curry', 1], ['malabar-parotta', 2]], payment: 'cash' },
  { n: 171, type: 'delivery', status: 'preparing', age: 15, customer: 'cu-01', lines: [['mutton-kondattam-biryani', 2], ['pepper-chicken-dry', 1], ['rose-milk', 2]], notes: 'Less spicy, please.' },
  { n: 170, type: 'delivery', status: 'preparing', age: 19, customer: 'cu-05', lines: [['paneer-tikka-masala', 1], ['erode-karuveppilai-sadam', 1], ['butter-naan', 2]] },
  { n: 169, type: 'pickup', status: 'ready', age: 22, customer: 'cu-11', lines: [['erode-special-biryani', 1], ['filter-coffee', 1]] },
  { n: 168, type: 'delivery', status: 'ready', age: 26, customer: 'cu-13', lines: [['chilli-baby-corn', 1], ['veg-dum-biryani', 2]] },
  { n: 167, type: 'delivery', status: 'out-for-delivery', age: 31, customer: 'cu-04', lines: [['butter-chicken', 2], ['malabar-parotta', 3]], payment: 'cash' },
  { n: 166, type: 'delivery', status: 'out-for-delivery', age: 36, customer: 'cu-08', lines: [['erode-special-biryani', 3], ['pepper-chicken-dry', 1], ['masala-chaas', 3]] },
  { n: 165, type: 'pickup', status: 'picked-up', age: 41, customer: 'cu-09', lines: [['gobi-65', 2], ['fresh-lime-soda', 2]] },
  { n: 164, type: 'delivery', status: 'cancelled', age: 44, customer: 'cu-03', lines: [['mutton-chukka', 1], ['malabar-parotta', 2]], reason: 'Item sold out' },
  { n: 163, type: 'delivery', status: 'delivered', age: 49, customer: 'cu-14', lines: [['chettinad-chicken-curry', 1], ['erode-karuveppilai-sadam', 2]] },
  { n: 162, type: 'delivery', status: 'rejected', age: 53, customer: 'cu-12', lines: [['kothu-parotta', 2]], reason: 'Outside delivery area' },
  { n: 161, type: 'pickup', status: 'picked-up', age: 58, customer: 'cu-02', lines: [['paneer-tikka-masala', 1], ['butter-naan', 3]] },
  { n: 160, type: 'delivery', status: 'delivered', age: 64, customer: 'cu-01', lines: [['erode-special-biryani', 2], ['gulab-jamun', 2]] },
  { n: 159, type: 'delivery', status: 'delivered', age: 71, customer: 'cu-05', lines: [['veg-dum-biryani', 1], ['rose-milk', 1]] },
  { n: 158, type: 'pickup', status: 'picked-up', age: 77, customer: 'cu-11', lines: [['filter-coffee', 4], ['malabar-parotta', 4]], payment: 'cash' },
  { n: 157, type: 'delivery', status: 'delivered', age: 85, customer: 'cu-08', lines: [['mutton-kondattam-biryani', 1], ['chilli-baby-corn', 1]] },
  { n: 156, type: 'delivery', status: 'cancelled', age: 92, customer: 'cu-10', lines: [['butter-chicken', 1]], reason: 'Customer asked to cancel' },
  { n: 155, type: 'delivery', status: 'delivered', age: 98, customer: 'cu-07', lines: [['pepper-chicken-dry', 2], ['butter-naan', 2]] },
  { n: 154, type: 'pickup', status: 'picked-up', age: 106, customer: 'cu-03', lines: [['erode-special-biryani', 1]] },
  { n: 153, type: 'delivery', status: 'delivered', age: 113, customer: 'cu-13', lines: [['chettinad-chicken-curry', 2], ['malabar-parotta', 4], ['masala-chaas', 2]] },
  { n: 152, type: 'delivery', status: 'delivered', age: 121, customer: 'cu-14', lines: [['gobi-65', 1], ['veg-dum-biryani', 1]] },
  { n: 151, type: 'pickup', status: 'picked-up', age: 130, customer: 'cu-06', lines: [['kothu-parotta', 1], ['rose-milk', 1]], payment: 'cash' },
];

/** Minutes each step typically takes, used to space out the sample history. */
const STEP_MINUTES: Partial<Record<OrderStatus, number>> = {
  confirmed: 1,
  preparing: 3,
  ready: 14,
  'out-for-delivery': 4,
  delivered: 18,
  'picked-up': 9,
};

export const MOCK_ORDERS: Order[] = SEEDS.map(buildOrder);

function buildOrder(seed: Seed): Order {
  const customer = MOCK_CUSTOMERS.find((c) => c.id === seed.customer)!;
  const lines: OrderLine[] = seed.lines.map(([itemId, quantity]) => {
    const item = MOCK_ITEMS.find((i) => i.id === itemId)!;
    return { itemId, name: item.name, price: item.price, quantity };
  });
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const deliveryFee = seed.type === 'delivery' ? DELIVERY_FEE : 0;

  return {
    number: String(seed.n).padStart(4, '0'),
    type: seed.type,
    status: seed.status,
    placedAt: minutesAgo(seed.age),
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    address:
      seed.type === 'delivery' ? `${12 + (seed.n % 40)}, ${customer.area}, Erode 6380${10 + (seed.n % 9)}` : undefined,
    notes: seed.notes,
    payment: seed.payment ?? 'online',
    lines,
    subtotal,
    tax,
    deliveryFee,
    total: subtotal + tax + deliveryFee,
    history: buildHistory(seed),
  };
}

function buildHistory(seed: Seed): StatusEvent[] {
  const events: StatusEvent[] = [{ status: 'pending', at: minutesAgo(seed.age) }];
  const stopped = seed.status === 'rejected' || seed.status === 'cancelled';
  const target: OrderStatus = seed.status === 'rejected' ? 'pending' : seed.status === 'cancelled' ? 'confirmed' : seed.status;
  let elapsed = 0;

  for (const step of LIFECYCLE[seed.type].slice(1)) {
    if (LIFECYCLE[seed.type].indexOf(step) > LIFECYCLE[seed.type].indexOf(target)) break;
    elapsed = Math.min(elapsed + (STEP_MINUTES[step] ?? 2), seed.age - 1);
    events.push({ status: step, at: minutesAgo(seed.age - elapsed) });
  }

  if (stopped) {
    elapsed = Math.min(elapsed + 2, seed.age - 1);
    events.push({ status: seed.status, at: minutesAgo(seed.age - elapsed), note: seed.reason });
  }
  return events;
}
