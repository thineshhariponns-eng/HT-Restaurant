import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import type { Order } from '../../../../core/models/order';
import { STOP_REASONS, stopAction } from '../../../../core/order-lifecycle';

/** Confirms rejecting a new order or cancelling an accepted one, and asks why. */
@Component({
  selector: 'app-stop-order-dialog',
  imports: [HlmAlertDialogImports, HlmButton, HlmTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stop-order-dialog.html',
})
export class StopOrderDialog {
  /** The order to stop; null keeps the dialog closed. */
  readonly order = input<Order | null>(null);
  readonly confirmed = output<{ number: string; reason: string }>();
  readonly dismissed = output<void>();

  protected readonly reason = signal('');
  protected readonly note = signal('');
  protected readonly showError = signal(false);

  protected readonly action = computed(() => {
    const order = this.order();
    return order ? stopAction(order.status) : null;
  });
  protected readonly reasons = computed(() => STOP_REASONS[this.action() ?? 'reject']);
  protected readonly verb = computed(() => (this.action() === 'cancel' ? 'Cancel' : 'Reject'));
  protected readonly state = computed(() => (this.order() ? 'open' : 'closed'));

  protected choose(reason: string): void {
    this.reason.set(reason);
    this.showError.set(false);
  }

  protected confirm(): void {
    const order = this.order();
    if (!order) return;
    const reason = this.reason();
    const note = this.note().trim();
    if (!reason || (reason === 'Other' && !note)) {
      this.showError.set(true);
      return;
    }
    this.confirmed.emit({ number: order.number, reason: reason === 'Other' ? note : reason });
    this.reset();
  }

  protected close(): void {
    this.reset();
    this.dismissed.emit();
  }

  private reset(): void {
    this.reason.set('');
    this.note.set('');
    this.showError.set(false);
  }
}
