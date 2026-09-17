import { Component, input } from '@angular/core';
import { RESTAURANT_CONTACT } from '../../data/restaurant-info';
import type { DeliveryAddress, OrderCustomer } from '../../services/order';
import type { OrderType } from '../order-type-selector/order-type-selector';

@Component({
  selector: 'app-delivery-information',
  imports: [],
  templateUrl: './delivery-information.html',
  styleUrl: './delivery-information.css'
})
export class DeliveryInformation {
  readonly customer = input.required<OrderCustomer>();
  readonly type = input.required<OrderType>();
  readonly address = input<DeliveryAddress | undefined>(undefined);

  protected readonly restaurant = RESTAURANT_CONTACT;
}
