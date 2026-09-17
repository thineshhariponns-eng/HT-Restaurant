import { TestBed } from '@angular/core/testing';
import { CancelOrderDialog, CancelOrderRequest } from './cancel-order-dialog';
import { MOCK_ORDERS } from '../../data/order-data';

const order = MOCK_ORDERS.find((candidate) => candidate.orderNumber === 'HT202609150021')!;
const text = (el: Element) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '';

// jsdom does not implement modal dialogs; model just the open attribute.
const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

function render() {
  const fixture = TestBed.createComponent(CancelOrderDialog);
  fixture.componentRef.setInput('order', order);
  const emitted: CancelOrderRequest[] = [];
  fixture.componentInstance.confirmed.subscribe((request) => emitted.push(request));
  fixture.detectChanges();
  fixture.componentInstance.open();
  fixture.detectChanges();

  const el = fixture.nativeElement as HTMLElement;
  const dialog = el.querySelector('dialog')!;
  const click = (selector: string) => {
    el.querySelector<HTMLElement>(selector)!.click();
    fixture.detectChanges();
  };
  const typeNote = (value: string) => {
    const textarea = el.querySelector('textarea')!;
    textarea.value = value;
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  return { el, dialog, emitted, click, typeNote };
}

describe('CancelOrderDialog', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
    TestBed.configureTestingModule({ imports: [CancelOrderDialog] });
  });

  afterEach(() => {
    HTMLDialogElement.prototype.showModal = originalShowModal;
    HTMLDialogElement.prototype.close = originalClose;
  });

  it('asks about the specific order and shows its total and reasons', () => {
    const { el, dialog } = render();

    expect(dialog.hasAttribute('open')).toBe(true);
    expect(text(el)).toContain('Cancel Order?');
    expect(text(el)).toContain('Are you sure you want to cancel order #HT202609150021?');
    expect(text(el.querySelector('[data-testid="cancel-total"]')!)).toBe('₹649');
    for (const label of ['I changed my mind', 'Ordered by mistake', 'Delivery is taking too long', 'Other']) {
      expect(text(el)).toContain(label);
    }
  });

  it('requires a reason before confirming', () => {
    const { el, dialog, emitted, click } = render();

    click('[data-testid="confirm-cancel"]');

    expect(emitted).toEqual([]);
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(text(el)).toContain('Choose a reason to cancel.');
  });

  it('requires a note when the reason is Other', () => {
    const { el, emitted, click, typeNote } = render();

    click('[data-testid="reason-other"]');
    click('[data-testid="confirm-cancel"]');
    expect(emitted).toEqual([]);
    expect(text(el)).toContain('Add a short note so the restaurant knows why.');

    typeNote('Plans changed');
    click('[data-testid="confirm-cancel"]');
    expect(emitted).toEqual([{ reason: 'other', note: 'Plans changed' }]);
  });

  it('emits the chosen reason and closes on confirm', () => {
    const { dialog, emitted, click } = render();

    click('[data-testid="reason-taking-too-long"]');
    click('[data-testid="confirm-cancel"]');

    expect(emitted).toEqual([{ reason: 'taking-too-long', note: '' }]);
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('closes without emitting on Keep Order', () => {
    const { dialog, emitted, click } = render();

    click('[data-testid="reason-changed-mind"]');
    click('[data-testid="keep-order"]');

    expect(emitted).toEqual([]);
    expect(dialog.hasAttribute('open')).toBe(false);
  });
});
