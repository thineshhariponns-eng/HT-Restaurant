import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrderTrackingService } from '../../services/order-tracking';
import { isActiveStatus, readyByIso } from '../../data/order-data';
import { RESTAURANT_CONTACT } from '../../data/restaurant-info';
import { OrderTracking } from '../../shared/order-tracking/order-tracking';
import { OrderStatusBadge } from '../../shared/order-status-badge/order-status-badge';
import { OrderItem } from '../../shared/order-item/order-item';
import { DeliveryInformation } from '../../shared/delivery-information/delivery-information';
import { OrderSummary } from '../../shared/order-summary/order-summary';

@Component({
  selector: 'app-order-details',
  imports: [RouterLink, DatePipe, OrderTracking, OrderStatusBadge, OrderItem, DeliveryInformation, OrderSummary],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css'
})
export class OrderDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly orderTracking = inject(OrderTrackingService);
  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });

  protected readonly contact = RESTAURANT_CONTACT;

  protected readonly order = computed(() => {
    const orderNumber = this.paramMap().get('orderNumber');
    return orderNumber ? this.orderTracking.getByNumber(orderNumber) : undefined;
  });

  /** "Arriving by" / "Ready by" only while the order is moving and not already waiting at the counter. */
  protected readonly readyBy = computed(() => {
    const order = this.order();
    if (!order || !isActiveStatus(order.status)) return null;
    if (order.type === 'pickup' && order.status === 'on-the-way') return null;
    return readyByIso(order);
  });
}
