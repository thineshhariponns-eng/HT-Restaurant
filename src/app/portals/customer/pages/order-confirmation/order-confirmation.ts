import {
  Component,
  DestroyRef,
  ElementRef,
  LOCALE_ID,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { formatDate } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Order, OrderService, OrderStatus } from '../../services/order';
import { MOCK_ORDERS } from '../../data/mock-order';
import { RESTAURANT_CONTACT } from '../../data/restaurant-info';
import type { OrderType } from '../../shared/order-type-selector/order-type-selector';

type StepState = 'completed' | 'current' | 'next' | 'upcoming';

interface Step {
  label: string;
  detail: string;
  state: StepState;
}

const STATUS_SEQUENCE: OrderStatus[] = ['confirmed', 'preparing', 'on-the-way', 'completed'];

const STEP_LABELS: Record<OrderType, string[]> = {
  pickup: ['Confirmed', 'Preparing', 'Ready for pickup', 'Picked up'],
  delivery: ['Confirmed', 'Preparing', 'Out for delivery', 'Delivered']
};

/** Index of the step that carries the ready-by estimate. */
const ESTIMATE_STEP: Record<OrderType, number> = { pickup: 2, delivery: 3 };

const STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  'on-the-way': 'On the way',
  completed: 'Completed'
};

const IST = '+0530';

@Component({
  selector: 'app-order-confirmation',
  imports: [RouterLink],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.css'
})
export class OrderConfirmation {
  private readonly orders = inject(OrderService);
  private readonly locale = inject(LOCALE_ID);
  private readonly destroyRef = inject(DestroyRef);

  private readonly previewType = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(
      map((params): OrderType => (params.get('type') === 'delivery' ? 'delivery' : 'pickup'))
    ),
    { initialValue: 'pickup' as OrderType }
  );

  protected readonly contact = RESTAURANT_CONTACT;
  protected readonly isSample = computed(() => this.orders.lastOrder() === null);
  protected readonly order = computed<Order>(() => this.orders.lastOrder() ?? MOCK_ORDERS[this.previewType()]);
  protected readonly isPickup = computed(() => this.order().type === 'pickup');

  protected readonly numberParts = computed(() => {
    const value = this.order().orderNumber;
    return { prefix: value.slice(0, 2), date: value.slice(2, 10), sequence: value.slice(10) };
  });

  protected readonly statusLabel = computed(() => STATUS_LABELS[this.order().status]);

  protected readonly placedLabel = computed(() => this.format(this.order().placedAt, 'd MMM y, h:mm a'));

  private readonly readyByLabel = computed(() => {
    const { placedAt, readyInMinutes } = this.order();
    return this.format(Date.parse(placedAt) + readyInMinutes.max * 60_000, 'h:mm a');
  });

  protected readonly timingHeadline = computed(() => {
    const { min, max } = this.order().readyInMinutes;
    return this.isPickup() ? `Ready for pickup in ${min}–${max} min` : `Arriving in ${min}–${max} min`;
  });

  protected readonly timingDetail = computed(() => `Expected around ${this.readyByLabel()}`);

  protected readonly steps = computed<Step[]>(() => {
    const order = this.order();
    const current = STATUS_SEQUENCE.indexOf(order.status);
    return STEP_LABELS[order.type].map((label, index) => ({
      label,
      state: index < current ? 'completed' : index === current ? 'current' : index === current + 1 ? 'next' : 'upcoming',
      detail:
        index === 0
          ? this.format(order.placedAt, 'h:mm a')
          : index === current + 1
            ? 'Up next'
            : index === ESTIMATE_STEP[order.type] && index > current
              ? `~${this.readyByLabel()}`
              : ''
    }));
  });

  protected readonly customerPhone = computed(() => {
    const digits = this.order().customer.phone;
    return /^\d{10}$/.test(digits) ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
  });

  protected readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');
  private copyResetTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private readonly statusSection = viewChild.required<ElementRef<HTMLElement>>('statusSection');
  private readonly statusHeading = viewChild.required<ElementRef<HTMLElement>>('statusHeading');

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus({ preventScroll: true }));
    this.destroyRef.onDestroy(() => clearTimeout(this.copyResetTimer));
  }

  protected trackOrder(): void {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.statusSection().nativeElement.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    this.statusHeading().nativeElement.focus({ preventScroll: true });
  }

  protected async copyOrderNumber(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.order().orderNumber);
      this.copyState.set('copied');
    } catch {
      this.copyState.set('failed');
    }
    clearTimeout(this.copyResetTimer);
    this.copyResetTimer = setTimeout(() => this.copyState.set('idle'), 2000);
  }

  protected markerClass(state: StepState): string {
    switch (state) {
      case 'completed':
      case 'current':
        return 'border-primary-600 bg-primary-600 text-text-inverse';
      case 'next':
        return 'border-primary-600 bg-bg-base';
      default:
        return 'border-border-strong bg-bg-base';
    }
  }

  protected segmentClass(state: StepState): string {
    switch (state) {
      case 'completed':
        return 'bg-primary-600';
      case 'current':
        return 'bg-primary-600/40';
      default:
        return 'bg-border-strong';
    }
  }

  private format(value: string | number, pattern: string): string {
    return formatDate(value, pattern, this.locale, IST);
  }
}
