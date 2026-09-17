import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideMapPin, lucidePhone, lucideStickyNote, lucideX } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSheetTitle } from '@spartan-ng/helm/sheet';
import type { Order, OrderStatus } from '../../../../core/models/order';
import {
  LIFECYCLE,
  STATUS_LABEL,
  advanceLabel,
  isTerminal,
  stopAction,
} from '../../../../core/order-lifecycle';
import { Clock } from '../../../../core/services/clock';
import { formatClock, formatElapsed, formatRupees } from '../../../../core/utils/format';
import { OrderType } from '../../../../shared/components/order-type/order-type';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';

interface Step {
  status: OrderStatus;
  label: string;
  state: 'done' | 'current' | 'upcoming' | 'stopped';
  time?: string;
  note?: string;
}

@Component({
  selector: 'app-order-detail',
  imports: [NgIcon, HlmButton, HlmSheetTitle, OrderType, StatusBadge],
  providers: [provideIcons({ lucideCheck, lucideMapPin, lucidePhone, lucideStickyNote, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-full min-h-0 flex-col' },
  templateUrl: './order-detail.html',
})
export class OrderDetail {
  readonly order = input.required<Order>();
  readonly advance = output<string>();
  readonly stop = output<Order>();

  private readonly clock = inject(Clock);

  protected readonly rupees = formatRupees;
  protected readonly clockTime = formatClock;

  protected readonly placedAgo = computed(() => formatElapsed(this.order().placedAt, this.clock.now()));
  protected readonly nextLabel = computed(() => advanceLabel(this.order()));
  protected readonly stopLabel = computed(() => {
    const action = stopAction(this.order().status);
    return action === 'reject' ? 'Reject order' : action === 'cancel' ? 'Cancel order' : null;
  });
  protected readonly closed = computed(() => isTerminal(this.order().status));

  protected readonly paymentLabel = computed(() => {
    const { payment, type } = this.order();
    if (payment === 'online') return 'Paid online';
    return type === 'delivery' ? 'Cash on delivery' : 'Pay at pickup';
  });

  /** The lifecycle rail: every step of this order type, with the times it was reached. */
  protected readonly steps = computed<Step[]>(() => {
    const order = this.order();
    const reached = new Map(order.history.map((event) => [event.status, event]));
    const stoppedEvent = order.history.find((e) => e.status === 'rejected' || e.status === 'cancelled');
    const steps: Step[] = [];

    for (const status of LIFECYCLE[order.type]) {
      const event = reached.get(status);
      if (stoppedEvent && !event) break;
      steps.push({
        status,
        label: STATUS_LABEL[status],
        state: !event ? 'upcoming' : status === order.status ? 'current' : 'done',
        time: event ? formatClock(event.at) : undefined,
      });
    }
    if (stoppedEvent) {
      steps.push({
        status: stoppedEvent.status,
        label: STATUS_LABEL[stoppedEvent.status],
        state: 'stopped',
        time: formatClock(stoppedEvent.at),
        note: stoppedEvent.note,
      });
    }
    // A finished order has no "current" step: its last step reads as done.
    if (this.closed() && !stoppedEvent) steps[steps.length - 1].state = 'done';
    return steps;
  });
}
