import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { OrderDetails } from './order-details';

@Component({ template: '' })
class Blank {}

const text = (el: Element) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const steps = (el: HTMLElement) => Array.from(el.querySelectorAll('li[app-order-status-step]')).map(text);

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

async function render(orderNumber: string) {
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(`/orders/${orderNumber}`, OrderDetails);
  harness.detectChanges();
  return { harness, el: harness.routeNativeElement as HTMLElement };
}

describe('OrderDetails cancellation flow', () => {
  beforeEach(() => {
    sessionStorage.clear();
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'orders/:orderNumber', component: OrderDetails },
          { path: 'orders', component: Blank },
          { path: 'menu', component: Blank }
        ])
      ]
    });
  });

  afterEach(() => {
    HTMLDialogElement.prototype.showModal = originalShowModal;
    HTMLDialogElement.prototype.close = originalClose;
  });

  it('offers Cancel Order on a cancellable order', async () => {
    const { el } = await render('HT202609150021');

    expect(el.querySelector('[data-testid="cancel-order"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="not-cancellable"]')).toBeNull();
  });

  it('explains, without offering the action, when an order can no longer be cancelled', async () => {
    const { el } = await render('HT202609150025');

    expect(el.querySelector('[data-testid="cancel-order"]')).toBeNull();
    expect(el.querySelector('app-cancel-order-dialog')).toBeNull();
    expect(text(el.querySelector('[data-testid="not-cancellable"]')!)).toContain('This order can no longer be cancelled.');
  });

  it('switches the page to the cancelled state after confirming', async () => {
    const { harness, el } = await render('HT202609150021');
    const click = (selector: string) => {
      el.querySelector<HTMLElement>(selector)!.click();
      harness.detectChanges();
    };

    click('[data-testid="cancel-order"]');
    click('[data-testid="reason-taking-too-long"]');
    click('[data-testid="confirm-cancel"]');
    await harness.fixture.whenStable();

    expect(text(el)).toContain('Order Cancelled');
    expect(text(el)).toContain('Order #HT202609150021');
    expect(text(el)).toContain('This order has been cancelled.');
    const details = text(el.querySelector('[data-testid="cancellation-details"]')!);
    expect(details).toContain('Delivery is taking too long');
    expect(details).toMatch(/Cancelled\s?\w{3} \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M/);
    expect(details).toContain('₹649');

    expect(steps(el)).toHaveLength(2);
    expect(steps(el)[0]).toContain('Order Created');
    expect(steps(el)[1]).toContain('Cancelled');
    expect(text(el)).not.toContain('Out for Delivery');
    expect(el.querySelector('[data-testid="cancel-order"]')).toBeNull();
    expect(document.activeElement?.textContent?.trim()).toBe('Order Cancelled');
  });

  it('renders an existing cancelled order through the same view', async () => {
    const { el } = await render('HT202609141958');

    expect(text(el)).toContain('Order Cancelled');
    expect(text(el.querySelector('[data-testid="cancellation-details"]')!)).toContain('Ordered by mistake');
    expect(steps(el)).toHaveLength(2);
  });
});
