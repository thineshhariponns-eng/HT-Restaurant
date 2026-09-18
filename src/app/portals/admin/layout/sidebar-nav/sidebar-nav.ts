import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChartColumn,
  lucideClipboardList,
  lucideContact,
  lucideLayoutDashboard,
  lucideSettings,
  lucideUsers,
  lucideUtensilsCrossed,
} from '@ng-icons/lucide';
import { OrdersStore } from '../../core/services/orders-store';
import { NAV_GROUPS, SETTINGS_LINK } from '../nav';

@Component({
  selector: 'app-sidebar-nav',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, NgIcon],
  providers: [
    provideIcons({
      lucideLayoutDashboard,
      lucideClipboardList,
      lucideUtensilsCrossed,
      lucideUsers,
      lucideContact,
      lucideChartColumn,
      lucideSettings,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-full flex-col' },
  templateUrl: './sidebar-nav.html',
})
export class SidebarNav {
  /** Emits after a link is chosen, so the mobile drawer can close. */
  readonly navigated = output<void>();

  protected readonly groups = NAV_GROUPS;
  protected readonly settings = SETTINGS_LINK;
  protected readonly pendingCount = inject(OrdersStore).pendingCount;
}
