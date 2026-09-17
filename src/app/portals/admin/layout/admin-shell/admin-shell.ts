import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMenu } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmToaster } from '@spartan-ng/helm/sonner';
import { filter, map } from 'rxjs';
import { Clock } from '../../core/services/clock';
import { SidebarNav } from '../sidebar-nav/sidebar-nav';

const DATE = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const TIME = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, NgIcon, HlmButton, HlmSheetImports, HlmToaster, SidebarNav],
  providers: [provideIcons({ lucideMenu })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-shell.html',
})
export class AdminShell {
  private readonly router = inject(Router);
  private readonly clock = inject(Clock);

  protected readonly drawer = signal<'open' | 'closed'>('closed');

  /** The deepest route's label drives the breadcrumb. */
  protected readonly pageLabel = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => deepestLabel(this.router.routerState.snapshot.root)),
    ),
    { initialValue: deepestLabel(this.router.routerState.snapshot.root) },
  );

  protected readonly today = computed(() => DATE.format(this.clock.now()));
  protected readonly time = computed(() => TIME.format(this.clock.now()).toLowerCase());
}

function deepestLabel(route: ActivatedRouteSnapshot): string {
  let current = route;
  while (current.firstChild) current = current.firstChild;
  return (current.data['label'] as string | undefined) ?? '';
}
