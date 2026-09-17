import { TestBed } from '@angular/core/testing';
import { OrderTrackingService } from './order-tracking';

describe('OrderTrackingService cancellation (local demo state)', () => {
  let service: OrderTrackingService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderTrackingService);
  });

  it('marks a cancellable order cancelled and records reason, trimmed note and time', () => {
    service.cancel('HT202609150021', 'taking-too-long', '  Running late for a train  ');

    const order = service.getByNumber('HT202609150021')!;
    expect(order.status).toBe('cancelled');
    expect(order.cancellable).toBe(false);
    expect(order.cancellation?.reason).toBe('taking-too-long');
    expect(order.cancellation?.note).toBe('Running late for a train');
    expect(Number.isNaN(Date.parse(order.cancellation!.at))).toBe(false);
    expect(order.history.at(-1)).toEqual({ status: 'cancelled', at: order.cancellation!.at });
  });

  it('ignores orders that can no longer be cancelled', () => {
    service.cancel('HT202609150025', 'changed-mind', '');

    const order = service.getByNumber('HT202609150025')!;
    expect(order.status).toBe('on-the-way');
    expect(order.cancellation).toBeUndefined();
  });

  it('reflects the cancellation in the order list', () => {
    service.cancel('HT202609150021', 'ordered-by-mistake', '');

    expect(service.list().find((order) => order.orderNumber === 'HT202609150021')?.status).toBe('cancelled');
  });
});
