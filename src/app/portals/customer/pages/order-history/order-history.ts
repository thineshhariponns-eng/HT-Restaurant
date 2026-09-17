import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MENU_DISHES } from '../../data/menu-data';
import { TrackedOrder, orderStatusGroup } from '../../data/order-data';
import { CartService } from '../../services/cart';
import { OrderTrackingService } from '../../services/order-tracking';
import { EmptyOrdersState } from '../../shared/empty-orders-state/empty-orders-state';
import { OrderFilter, OrderFilterCounts, OrderFilterValue } from '../../shared/order-filter/order-filter';
import { OrderHistoryCard } from '../../shared/order-history-card/order-history-card';

@Component({
  selector: 'app-order-history',
  imports: [OrderFilter, OrderHistoryCard, EmptyOrdersState],
  templateUrl: './order-history.html',
  styleUrl: './order-history.css'
})
export class OrderHistory {
  private readonly orderTracking = inject(OrderTrackingService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);

  protected readonly orders = computed(() => this.orderTracking.list());

  protected readonly searchQuery = signal('');
  protected readonly selectedFilter = signal<OrderFilterValue>('all');

  protected readonly counts = computed<OrderFilterCounts>(() => {
    const counts: OrderFilterCounts = { all: 0, active: 0, completed: 0, cancelled: 0 };
    for (const order of this.orders()) {
      counts.all++;
      counts[orderStatusGroup(order.status)]++;
    }
    return counts;
  });

  protected readonly filteredOrders = computed(() => {
    const query = this.searchQuery().trim().replace(/^#/, '').toLowerCase();
    const filter = this.selectedFilter();

    return this.orders().filter((order) => {
      const matchesFilter = filter === 'all' || orderStatusGroup(order.status) === filter;
      const matchesQuery =
        query.length === 0 ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.lines.some((line) => line.name.toLowerCase().includes(query));
      return matchesFilter && matchesQuery;
    });
  });

  protected readonly noMatchMessage = computed(() => {
    const query = this.searchQuery().trim();
    if (query.length > 0) return `No orders match “${query}”.`;
    const filter = this.selectedFilter();
    return filter === 'all' ? 'No orders to show.' : `No ${filter} orders.`;
  });

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected selectFilter(filter: OrderFilterValue): void {
    this.selectedFilter.set(filter);
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.selectedFilter.set('all');
  }

  /** Lines that can't be re-ordered today: sold out, or no longer on the menu. */
  protected unavailableCount(order: TrackedOrder): number {
    return order.lines.filter((line) => !MENU_DISHES.find((dish) => dish.slug === line.slug)?.isAvailable).length;
  }

  /** Re-adds every still-available dish at today's menu price, then opens the cart. */
  protected onOrderAgain(order: TrackedOrder): void {
    for (const line of order.lines) {
      const dish = MENU_DISHES.find((candidate) => candidate.slug === line.slug);
      if (dish?.isAvailable) {
        this.cart.addItem(dish, line.quantity);
      }
    }
    this.router.navigate(['/cart']);
  }
}
