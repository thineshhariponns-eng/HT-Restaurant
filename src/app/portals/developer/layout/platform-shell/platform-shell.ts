import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { SidebarNav } from '../sidebar-nav/sidebar-nav';

@Component({
  selector: 'app-platform-shell',
  imports: [RouterOutlet, SidebarNav],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './platform-shell.html',
})
export class PlatformShell {
  private readonly router = inject(Router);

  protected readonly drawerOpen = signal(false);

  /** The deepest route's label drives the breadcrumb. */
  protected readonly pageLabel = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => deepestLabel(this.router.routerState.snapshot.root)),
    ),
    { initialValue: deepestLabel(this.router.routerState.snapshot.root) },
  );
}

function deepestLabel(route: ActivatedRouteSnapshot): string {
  let current = route;
  while (current.firstChild) current = current.firstChild;
  return (current.data['label'] as string | undefined) ?? '';
}
