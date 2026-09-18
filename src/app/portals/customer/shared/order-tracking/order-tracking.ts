import { Component, Injector, afterNextRender, computed, inject, input, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { STATUS_COPY, TrackedOrder, isActiveStatus, readyByIso } from '../../data/order-data';
import { RESTAURANT_CONTACT } from '../../data/restaurant-info';
import { OrderTrackingService } from '../../services/order-tracking';
import { CancelOrderDialog, CancelOrderRequest } from '../cancel-order-dialog/cancel-order-dialog';
import { CancelledOrderState } from '../cancelled-order-state/cancelled-order-state';
import { OrderStatusTracker } from '../order-status-tracker/order-status-tracker';

/** The order-status panel: progress rail, current state, and the customer's cancel action. */
@Component({
  selector: 'app-order-tracking',
  imports: [DatePipe, RouterLink, OrderStatusTracker, CancelOrderDialog, CancelledOrderState],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.css'
})
export class OrderTracking {
  readonly order = input.required<TrackedOrder>();

  private readonly orderTracking = inject(OrderTrackingService);
  private readonly injector = inject(Injector);
  private readonly cancelDialog = viewChild(CancelOrderDialog);
  private readonly cancelledState = viewChild(CancelledOrderState);

  protected readonly contact = RESTAURANT_CONTACT;

  protected readonly statusCopy = computed(() => STATUS_COPY[this.order().type][this.order().status]);
  protected readonly isActive = computed(() => isActiveStatus(this.order().status));
  protected readonly isCancelled = computed(() => this.order().status === 'cancelled');
  protected readonly isRejected = computed(() => this.order().status === 'rejected');
  protected readonly isEnded = computed(() => this.order().status === 'completed');
  protected readonly isReadyForPickup = computed(() => this.order().type === 'pickup' && this.order().status === 'on-the-way');
  protected readonly readyBy = computed(() => readyByIso(this.order()));

  protected readonly lastEventAt = computed(() => {
    const history = this.order().history;
    return history[history.length - 1]?.at ?? null;
  });

  protected openCancelDialog(): void {
    this.cancelDialog()?.open();
  }

  protected onCancelConfirmed(request: CancelOrderRequest): void {
    this.orderTracking.cancel(this.order().orderNumber, request.reason, request.note);
    afterNextRender(() => this.cancelledState()?.focusHeading(), { injector: this.injector });
  }
}
