import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';

/** Holds a section's place in the navigation until its screen is built. */
@Component({
  selector: 'app-not-built',
  imports: [RouterLink, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="border-b border-border-subtle px-4 pt-8 pb-6 sm:px-6 lg:px-8">
      <h1 class="font-display text-2xl font-semibold text-text-primary sm:text-3xl">
        {{ label() || 'Page not found' }}
      </h1>
    </header>
    <div class="max-w-md px-4 py-12 sm:px-6 lg:px-8">
      @if (label()) {
        <p class="text-text-body">
          This screen isn't built yet. It's queued after the Orders screen is reviewed.
        </p>
      } @else {
        <p class="text-text-body">There's no admin page at this address.</p>
      }
      <a hlmBtn variant="outline" class="mt-6" routerLink="/orders">Go to Orders</a>
    </div>
  `,
})
export class NotBuilt {
  /** Bound from route data. */
  readonly label = input<string>('');
}
