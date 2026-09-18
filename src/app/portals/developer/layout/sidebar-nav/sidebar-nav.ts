import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_GROUPS } from '../nav';

@Component({
  selector: 'app-sidebar-nav',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-full flex-col' },
  templateUrl: './sidebar-nav.html',
})
export class SidebarNav {
  /** Emits after a link is chosen, so the mobile drawer can close. */
  readonly navigated = output<void>();

  protected readonly groups = NAV_GROUPS;
}
