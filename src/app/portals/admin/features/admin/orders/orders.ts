import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideArrowUpDown,
  lucideEllipsis,
  lucideInbox,
  lucideRotateCcw,
  lucideSearch,
  lucideTriangleAlert,
  lucideX,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { map } from 'rxjs';
import type { Order, OrderStatus, OrderType as OrderTypeValue } from '../../../core/models/order';
import { advanceLabel, stopAction } from '../../../core/order-lifecycle';
import { Clock } from '../../../core/services/clock';
import { OrdersStore } from '../../../core/services/orders-store';
import { formatClock, formatElapsed, formatRupees, minutesSince } from '../../../core/utils/format';
import { OrderType } from '../../../shared/components/order-type/order-type';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { OrderActions } from './order-actions';
import { OrderDetail } from './order-detail/order-detail';
import { StopOrderDialog } from './stop-order-dialog/stop-order-dialog';

type View = 'new' | 'in-progress' | 'on-the-way' | 'closed' | 'all';
type TypeFilter = 'all' | OrderTypeValue;
type SortKey = 'placed' | 'total';

const VIEW_STATUSES: Record<Exclude<View, 'all'>, OrderStatus[]> = {
  new: ['pending'],
  'in-progress': ['confirmed', 'preparing', 'ready'],
  'on-the-way': ['out-for-delivery'],
  closed: ['delivered', 'picked-up', 'rejected', 'cancelled'],
};

const VIEWS: { id: View; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'on-the-way', label: 'On the way' },
  { id: 'closed', label: 'Closed' },
  { id: 'all', label: 'All' },
];

const PAGE_SIZE = 10;
/** A new order waiting longer than this is flagged. */
const LATE_AFTER_MINUTES = 5;

@Component({
  selector: 'app-orders',
  imports: [
    NgIcon,
    HlmButton,
    HlmInput,
    HlmSkeleton,
    HlmTableImports,
    HlmDropdownMenuImports,
    HlmSheetImports,
    OrderType,
    StatusBadge,
    OrderDetail,
    StopOrderDialog,
  ],
  providers: [
    provideIcons({
      lucideArrowDown,
      lucideArrowUp,
      lucideArrowUpDown,
      lucideEllipsis,
      lucideInbox,
      lucideRotateCcw,
      lucideSearch,
      lucideTriangleAlert,
      lucideX,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
  templateUrl: './orders.html',
})
export class Orders {
  private readonly store = inject(OrdersStore);
  private readonly actions = inject(OrderActions);
  private readonly clock = inject(Clock);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('search');

  protected readonly views = VIEWS;
  protected readonly rupees = formatRupees;
  protected readonly clockTime = formatClock;
  protected readonly nextLabel = advanceLabel;

  /** `?demo=loading|error|empty` previews the list states; there is no backend to fail for real. */
  protected readonly demo = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('demo'))), {
    initialValue: null,
  });

  protected readonly view = signal<View>(this.store.pendingCount() > 0 ? 'new' : 'in-progress');
  protected readonly typeFilter = signal<TypeFilter>('all');
  protected readonly query = signal('');
  protected readonly sort = signal<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'placed', dir: 'desc' });
  protected readonly page = signal(0);

  protected readonly openNumber = signal<string | null>(null);
  protected readonly stopping = signal<Order | null>(null);

  private readonly source = computed(() => (this.demo() === 'empty' ? [] : this.store.orders()));

  protected readonly counts = computed(() => {
    const orders = this.source();
    const counts = { all: orders.length } as Record<View, number>;
    for (const [view, statuses] of Object.entries(VIEW_STATUSES)) {
      counts[view as View] = orders.filter((o) => statuses.includes(o.status)).length;
    }
    return counts;
  });

  protected readonly filtered = computed(() => {
    const view = this.view();
    const type = this.typeFilter();
    const q = this.query().trim().toLowerCase().replace(/^#/, '');
    const { key, dir } = this.sort();

    const rows = this.source().filter(
      (o) =>
        (view === 'all' || VIEW_STATUSES[view].includes(o.status)) &&
        (type === 'all' || o.type === type) &&
        (!q ||
          o.number.includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.replaceAll(' ', '').includes(q.replaceAll(' ', ''))),
    );
    const sign = dir === 'asc' ? 1 : -1;
    return rows.sort((a, b) =>
      key === 'total' ? (a.total - b.total) * sign : a.placedAt.localeCompare(b.placedAt) * sign,
    );
  });

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  protected readonly pageRows = computed(() =>
    this.filtered().slice(this.page() * PAGE_SIZE, (this.page() + 1) * PAGE_SIZE),
  );
  protected readonly rangeLabel = computed(() => {
    const total = this.filtered().length;
    if (total === 0) return '';
    const start = this.page() * PAGE_SIZE + 1;
    return `${start}–${Math.min(start + PAGE_SIZE - 1, total)} of ${total}`;
  });

  protected readonly openOrder = computed(() => {
    const number = this.openNumber();
    return number ? (this.store.get(number) ?? null) : null;
  });
  protected readonly sheetState = computed(() => (this.openOrder() ? 'open' : 'closed'));

  protected readonly summary = computed(() => {
    const c = this.counts();
    return `${c.new} new · ${c['in-progress'] + c['on-the-way']} in progress · ${c.all} tonight`;
  });

  constructor() {
    // Any change to what is listed starts again from the first page.
    effect(() => {
      this.view();
      this.typeFilter();
      this.query();
      this.page.set(0);
    });
  }

  protected age(order: Order): string {
    return formatElapsed(order.placedAt, this.clock.now());
  }

  protected isLate(order: Order): boolean {
    return order.status === 'pending' && minutesSince(order.placedAt, this.clock.now()) >= LATE_AFTER_MINUTES;
  }

  protected itemsSummary(order: Order): string {
    const [first, ...rest] = order.lines;
    const head = `${first.name} ×${first.quantity}`;
    return rest.length ? `${head}, +${rest.length} more` : head;
  }

  protected canStop(order: Order): string | null {
    const action = stopAction(order.status);
    return action === 'reject' ? 'Reject order' : action === 'cancel' ? 'Cancel order' : null;
  }

  protected toggleSort(key: SortKey): void {
    this.sort.update((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
  }

  protected ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    const s = this.sort();
    return s.key !== key ? 'none' : s.dir === 'asc' ? 'ascending' : 'descending';
  }

  protected advance(number: string): void {
    this.actions.advance(number);
  }

  protected confirmStop(event: { number: string; reason: string }): void {
    this.stopping.set(null);
    this.actions.stop(event.number, event.reason);
  }

  protected clearFilters(): void {
    this.query.set('');
    this.typeFilter.set('all');
    this.view.set('all');
  }

  protected retry(): void {
    this.router.navigate([], { queryParams: { demo: null }, queryParamsHandling: 'merge' });
  }

  /** "/" jumps to search, as in most admin tools. */
  protected onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const typing = target.closest('input, textarea, select, [contenteditable]');
    if (event.key === '/' && !typing && !this.openNumber()) {
      event.preventDefault();
      this.searchInput()?.nativeElement.focus();
    }
  }
}
