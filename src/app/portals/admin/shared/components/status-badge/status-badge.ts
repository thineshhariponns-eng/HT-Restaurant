import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { OrderStatus } from '../../../core/models/order';
import { STATUS_LABEL, statusTone } from '../../../core/order-lifecycle';

const DOT_CLASS = {
  attention: 'bg-status-pending motion-safe:animate-pulse',
  kitchen: 'bg-status-confirmed',
  delivery: 'bg-status-delivery',
  done: 'bg-status-delivered',
  stopped: 'bg-status-cancelled',
} as const;

/** Square status tag. The dot carries the colour; the label stays neutral so it always passes contrast. */
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <span
      class="label-caps inline-flex items-center gap-2 border border-border-strong px-2 py-1 whitespace-nowrap text-text-body"
    >
      <span class="size-1.5 shrink-0 rounded-full" [class]="dotClass()" aria-hidden="true"></span>
      {{ label() }}
    </span>
  `,
})
export class StatusBadge {
  readonly status = input.required<OrderStatus>();

  protected readonly label = computed(() => STATUS_LABEL[this.status()]);
  protected readonly dotClass = computed(() => DOT_CLASS[statusTone(this.status())]);
}
