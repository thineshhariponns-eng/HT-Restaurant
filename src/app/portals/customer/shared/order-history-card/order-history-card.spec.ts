import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OrderHistoryCard } from './order-history-card';
import { MOCK_ORDERS, TrackedOrder } from '../../data/order-data';

const byNumber = (orderNumber: string) => MOCK_ORDERS.find((order) => order.orderNumber === orderNumber)!;
const text = (el: Element) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '';

function render(order: TrackedOrder, options: { unavailableCount?: number; now?: Date } = {}) {
  const fixture = TestBed.createComponent(OrderHistoryCard);
  fixture.componentRef.setInput('order', order);
  fixture.componentRef.setInput('unavailableCount', options.unavailableCount ?? 0);
  fixture.componentRef.setInput('now', options.now ?? new Date('2026-09-15T12:00:00+05:30'));
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('OrderHistoryCard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [OrderHistoryCard], providers: [provideRouter([])] });
  });

  it('shows number, relative date, item count, type, lines and total', () => {
    const el = render(byNumber('HT202609150021'));

    expect(text(el)).toContain('#HT202609150021');
    expect(text(el)).toContain('Today · 10:32 AM');
    expect(text(el)).toContain('3 items');
    expect(text(el)).toContain('Delivery');
    expect(text(el)).toContain('Chicken Biryani × 2');
    expect(text(el)).toContain('Lime Juice × 1');
    expect(text(el)).toContain('₹649');
    expect(text(el)).toContain('Track Order');
  });

  it('falls back to Yesterday and then to the date', () => {
    const order = byNumber('HT202609141958');

    expect(text(render(order))).toContain('Yesterday · 7:58 PM');
    expect(text(render(order, { now: new Date('2026-09-20T12:00:00+05:30') }))).toContain('Sep 14, 2026 · 7:58 PM');
  });

  it('collapses extra lines into "+ N more"', () => {
    const order: TrackedOrder = {
      ...byNumber('HT202609150028'),
      lines: [
        { slug: 'a', name: 'Dish A', price: 10, quantity: 1 },
        { slug: 'b', name: 'Dish B', price: 10, quantity: 1 },
        { slug: 'c', name: 'Dish C', price: 10, quantity: 1 }
      ]
    };

    const el = render(order);
    expect(text(el)).not.toContain('Dish C');
    expect(text(el)).toContain('+ 1 more');
  });

  it('notes partially unavailable items on a completed order', () => {
    const el = render(byNumber('HT202609150028'), { unavailableCount: 1 });

    expect(el.querySelector('[data-testid="unavailable-note"]')?.textContent?.trim()).toBe('1 item unavailable today');
    expect(el.querySelector<HTMLButtonElement>('[data-testid="order-again"]')!.disabled).toBe(false);
  });

  it('disables Order Again when nothing can be re-ordered', () => {
    const el = render(byNumber('HT202609150028'), { unavailableCount: 2 });
    const button = el.querySelector<HTMLButtonElement>('[data-testid="order-again"]')!;

    expect(button.disabled).toBe(true);
    expect(text(button)).toBe('Unavailable today');
    expect(el.querySelector('[data-testid="unavailable-note"]')).toBeNull();
  });
});
