import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBike, lucideShoppingBag } from '@ng-icons/lucide';
import type { OrderType as OrderTypeValue } from '../../../core/models/order';

@Component({
  selector: 'app-order-type',
  imports: [NgIcon],
  providers: [provideIcons({ lucideBike, lucideShoppingBag })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center gap-1.5 text-text-body whitespace-nowrap' },
  template: `
    <ng-icon
      [name]="type() === 'delivery' ? 'lucideBike' : 'lucideShoppingBag'"
      size="15"
      class="text-text-muted"
      aria-hidden="true"
    />
    {{ type() === 'delivery' ? 'Delivery' : 'Pickup' }}
  `,
})
export class OrderType {
  readonly type = input.required<OrderTypeValue>();
}
