import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { OrderConfirmation } from './order-confirmation';
import { OrderService } from '../../services/order';

async function render(url = '/order-confirmation') {
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url, OrderConfirmation);
  harness.detectChanges();
  return { harness, el: harness.routeNativeElement as HTMLElement };
}

const text = (el: HTMLElement) => el.textContent?.replace(/\s+/g, ' ') ?? '';

describe('OrderConfirmation', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'order-confirmation', component: OrderConfirmation }])]
    });
  });

  it('shows the pickup sample order when no order has been placed', async () => {
    const { el } = await render();

    expect(el.querySelector('[data-testid="order-number"]')?.textContent).toContain('HT202609140001');
    expect(el.querySelector('[data-testid="order-total"]')?.textContent?.trim()).toBe('₹649');
    expect(el.querySelector('[data-testid="delivery-fee"]')).toBeNull();
    expect(text(el)).toContain('Chicken Biryani × 2');
    expect(text(el)).toContain('Lime Juice × 1');
    expect(text(el)).toContain('Ready for pickup in 25–30 min');
    expect(text(el)).toContain('Pickup from');
    expect(text(el)).toContain('Sample order shown for preview');
  });

  it('shows the delivery sample with ?type=delivery', async () => {
    const { el } = await render('/order-confirmation?type=delivery');

    expect(el.querySelector('[data-testid="order-total"]')?.textContent?.trim()).toBe('₹689');
    expect(el.querySelector('[data-testid="delivery-fee"]')).not.toBeNull();
    expect(text(el)).toContain('Arriving in 40–50 min');
    expect(text(el)).toContain('Out for delivery');
    expect(text(el)).toContain('Delivering to');
  });

  it('shows a placed order instead of the sample', async () => {
    const order = TestBed.inject(OrderService).placeOrder({
      type: 'pickup',
      customer: { name: 'Test Customer', phone: '9876543210', email: 'test@example.com' },
      notes: 'No onions',
      lines: [{ slug: 'veg-dum-biryani', name: 'Veg Dum Biryani', price: 210, quantity: 1 }],
      subtotal: 210,
      tax: 11,
      deliveryFee: 0,
      total: 221
    });
    const { el } = await render();

    expect(el.querySelector('[data-testid="order-number"]')?.textContent).toContain(order.orderNumber);
    expect(el.querySelector('[data-testid="order-total"]')?.textContent?.trim()).toBe('₹221');
    expect(text(el)).toContain('Note: No onions');
    expect(text(el)).not.toContain('Sample order');
  });

  it('marks the confirmed step as the current step', async () => {
    const { el } = await render();
    const current = el.querySelectorAll('li[aria-current="step"]');

    expect(current.length).toBe(1);
    expect(text(current[0] as HTMLElement)).toContain('Confirmed');
  });

  it('moves focus to the order status when Track Order is clicked', async () => {
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    const { el } = await render();

    (el.querySelector('[data-testid="track-order"]') as HTMLButtonElement).click();

    expect(scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('order-status-heading');
  });

  it('links Back to Menu to /menu', async () => {
    const { el } = await render();
    expect(el.querySelector('[data-testid="back-to-menu"]')?.getAttribute('href')).toBe('/menu');
  });

  it('copies the order number and confirms it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { harness, el } = await render();
    const button = el.querySelector('[data-testid="copy-order-number"]') as HTMLButtonElement;

    button.click();
    await new Promise((resolve) => setTimeout(resolve));
    harness.detectChanges();

    expect(writeText).toHaveBeenCalledWith('HT202609140001');
    expect(button.textContent).toContain('Copied');
  });
});
