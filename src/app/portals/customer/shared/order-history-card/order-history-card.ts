import { Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TrackedOrder, orderStatusGroup } from '../../data/order-data';
import { OrderStatusBadge } from '../order-status-badge/order-status-badge';

/** How many item lines to show before collapsing the rest into "+ N more". */
const VISIBLE_LINES = 2;

/** Calendar day in the restaurant's timezone, so "Today" matches the IST times shown elsewhere. */
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });

@Component({
  selector: 'app-order-history-card',
  imports: [RouterLink, DatePipe, OrderStatusBadge],
  templateUrl: './order-history-card.html',
  styleUrl: './order-history-card.css'
})
export class OrderHistoryCard {
  readonly order = input.required<TrackedOrder>();
  /** Lines of this order that can't be re-ordered today (sold out or off the menu). */
  readonly unavailableCount = input<number>(0);
  /** Reference time for "Today" / "Yesterday"; injectable for tests. */
  readonly now = input<Date>(new Date());

  readonly orderAgain = output<void>();

  protected readonly group = computed(() => orderStatusGroup(this.order().status));
  protected readonly titleId = computed(() => `order-${this.order().orderNumber}`);
  protected readonly orderLink = computed(() => ['/orders', this.order().orderNumber]);

  protected readonly relativeDay = computed(() => {
    const placed = dayKey.format(new Date(this.order().placedAt));
    const now = this.now();
    if (placed === dayKey.format(now)) return 'Today';
    if (placed === dayKey.format(new Date(now.getTime() - 86_400_000))) return 'Yesterday';
    return null;
  });

  protected readonly itemCount = computed(() => this.order().lines.reduce((sum, line) => sum + line.quantity, 0));
  protected readonly visibleLines = computed(() => this.order().lines.slice(0, VISIBLE_LINES));
  protected readonly hiddenLineCount = computed(() => Math.max(0, this.order().lines.length - VISIBLE_LINES));

  protected readonly allUnavailable = computed(() => this.unavailableCount() >= this.order().lines.length);

  protected onOrderAgain(): void {
    if (!this.allUnavailable()) {
      this.orderAgain.emit();
    }
  }
}
