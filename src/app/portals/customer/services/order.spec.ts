import { TestBed } from '@angular/core/testing';
import { DELIVERY_ETA_MINUTES, OrderService, PICKUP_READY_MINUTES, PlaceOrderInput } from './order';

const baseInput: PlaceOrderInput = {
  type: 'delivery',
  customer: { name: 'Test Customer', phone: '9876543210', email: 'test@example.com' },
  deliveryAddress: { address: '1, Test Street', city: 'Erode', postalCode: '638001' },
  notes: '',
  lines: [{ slug: 'erode-special-biryani', name: 'Erode Special Biryani', price: 260, quantity: 2 }],
  subtotal: 520,
  tax: 26,
  deliveryFee: 40,
  total: 586
};

describe('OrderService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('issues HT + date + 4-digit sequence order numbers', () => {
    const service = TestBed.inject(OrderService);
    const first = service.placeOrder(baseInput);
    const second = service.placeOrder(baseInput);

    expect(first.orderNumber).toMatch(/^HT\d{12}$/);
    expect(first.orderNumber.endsWith('0001')).toBe(true);
    expect(second.orderNumber.endsWith('0002')).toBe(true);
  });

  it('snapshots the order as confirmed and exposes it as lastOrder', () => {
    const service = TestBed.inject(OrderService);
    const order = service.placeOrder(baseInput);

    expect(order.status).toBe('confirmed');
    expect(order.readyInMinutes).toEqual(DELIVERY_ETA_MINUTES);
    expect(order.subtotal + order.tax + order.deliveryFee).toBe(order.total);
    expect(service.lastOrder()).toEqual(order);
  });

  it('drops the delivery address for pickup orders and uses the pickup estimate', () => {
    const service = TestBed.inject(OrderService);
    const order = service.placeOrder({ ...baseInput, type: 'pickup', deliveryFee: 0, total: 546 });

    expect(order.deliveryAddress).toBeUndefined();
    expect(order.deliveryFee).toBe(0);
    expect(order.readyInMinutes).toEqual(PICKUP_READY_MINUTES);
  });

  it('restores the last order from sessionStorage', () => {
    const order = TestBed.inject(OrderService).placeOrder(baseInput);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    expect(TestBed.inject(OrderService).lastOrder()).toEqual(order);
  });
});
