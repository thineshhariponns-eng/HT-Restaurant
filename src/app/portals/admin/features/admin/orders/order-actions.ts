import { Injectable, inject } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';
import { STATUS_LABEL, nextStatus, stopAction } from '../../../core/order-lifecycle';
import { OrdersStore } from '../../../core/services/orders-store';

/** Status changes plus their confirmation toast, each with an Undo. Shared by the list and the detail sheet. */
@Injectable({ providedIn: 'root' })
export class OrderActions {
  private readonly store = inject(OrdersStore);

  advance(number: string): void {
    const previous = this.store.advance(number);
    if (!previous) return;
    const next = nextStatus(previous)!;
    toast(`Order #${number} · ${STATUS_LABEL[next]}`, {
      description: previous.status === 'pending' ? 'Sent to the kitchen.' : undefined,
      action: { label: 'Undo', onClick: () => this.store.restore(previous) },
    });
  }

  stop(number: string, reason: string): void {
    const previous = this.store.stop(number, reason);
    if (!previous) return;
    const verb = stopAction(previous.status) === 'reject' ? 'rejected' : 'cancelled';
    toast(`Order #${number} ${verb}`, {
      description: reason,
      action: { label: 'Undo', onClick: () => this.store.restore(previous) },
    });
  }
}
