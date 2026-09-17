import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Component } from '@angular/core';
import { OrderHistory } from './order-history';
import { CartService } from '../../services/cart';
import { OrderTrackingService } from '../../services/order-tracking';

@Component({ template: '' })
class Blank {}

async function render() {
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/orders', OrderHistory);
  harness.detectChanges();
  return { harness, el: harness.routeNativeElement as HTMLElement };
}

const text = (el: Element) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const cards = (el: HTMLElement) => Array.from(el.querySelectorAll('[data-testid="order-card"]'));

function search(harness: RouterTestingHarness, el: HTMLElement, value: string) {
  const input = el.querySelector<HTMLInputElement>('[data-testid="order-search"]')!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  harness.detectChanges();
}

function filter(harness: RouterTestingHarness, el: HTMLElement, value: string) {
  el.querySelector<HTMLButtonElement>(`[data-testid="filter-${value}"]`)!.click();
  harness.detectChanges();
}

describe('OrderHistory', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'orders', component: OrderHistory },
          { path: 'orders/:orderNumber', component: Blank },
          { path: 'cart', component: Blank },
          { path: 'menu', component: Blank }
        ])
      ]
    });
  });

  it('lists every mock order newest first with filter counts', async () => {
    const { el } = await render();

    expect(cards(el).length).toBe(7);
    expect(text(cards(el)[0])).toContain('#HT202609150025');
    expect(text(el.querySelector('[data-testid="filter-all"]')!)).toBe('All 7');
    expect(text(el.querySelector('[data-testid="filter-active"]')!)).toBe('Active 4');
    expect(text(el.querySelector('[data-testid="filter-completed"]')!)).toBe('Completed 1');
    expect(text(el.querySelector('[data-testid="filter-cancelled"]')!)).toBe('Cancelled 2');
    expect(text(el.querySelector('[data-testid="result-count"]')!)).toBe('Showing 7 of 7 orders');
  });

  it('shows the action that fits each status group', async () => {
    const { harness, el } = await render();

    filter(harness, el, 'active');
    expect(cards(el).length).toBe(4);
    for (const card of cards(el)) {
      expect(text(card)).toContain('Track Order');
      expect(text(card)).not.toContain('View Order');
    }

    filter(harness, el, 'completed');
    expect(cards(el).length).toBe(1);
    expect(text(cards(el)[0])).toContain('View Order');
    expect(text(cards(el)[0])).toContain('Order Again');

    filter(harness, el, 'cancelled');
    expect(cards(el).length).toBe(2);
    for (const card of cards(el)) {
      expect(text(card)).toContain('View Order');
      expect(text(card)).not.toContain('Order Again');
      expect(text(card)).not.toContain('Track Order');
    }
  });

  it('searches by order number (with or without #) and by dish name', async () => {
    const { harness, el } = await render();

    search(harness, el, '#HT202609150021');
    expect(cards(el).length).toBe(1);
    expect(text(cards(el)[0])).toContain('Chicken Biryani × 2');

    search(harness, el, '0021');
    expect(cards(el).length).toBe(1);

    search(harness, el, 'biryani');
    expect(cards(el).length).toBe(3);
  });

  it('offers to clear filters when nothing matches', async () => {
    const { harness, el } = await render();

    search(harness, el, 'dosa');
    expect(cards(el).length).toBe(0);
    expect(text(el)).toContain('No orders match “dosa”.');

    const clear = Array.from(el.querySelectorAll('button')).find((b) => text(b) === 'Clear search and filters')!;
    clear.click();
    harness.detectChanges();
    expect(cards(el).length).toBe(7);
  });

  it('re-adds available items to the cart and opens it on Order Again', async () => {
    const { harness, el } = await render();
    const cart = TestBed.inject(CartService);
    cart.clearCart();

    filter(harness, el, 'completed');
    el.querySelector<HTMLButtonElement>('[data-testid="order-again"]')!.click();
    await harness.fixture.whenStable();

    expect(cart.lines().map((line) => [line.slug, line.quantity])).toEqual([
      ['veg-dum-biryani', 1],
      ['masala-chaas', 1]
    ]);
    expect(TestBed.inject(Router).url).toBe('/cart');
  });

  it('shows the empty state when there are no orders', async () => {
    TestBed.overrideProvider(OrderTrackingService, { useValue: { list: () => [] } });
    const { el } = await render();

    expect(cards(el).length).toBe(0);
    expect(text(el)).toContain('No orders yet.');
    expect(text(el)).toContain('Your delicious first order is waiting.');
    expect(el.querySelector('a[href="/menu"]')?.textContent?.trim()).toBe('Browse Menu');
    expect(el.querySelector('[data-testid="order-search"]')).toBeNull();
  });
});
