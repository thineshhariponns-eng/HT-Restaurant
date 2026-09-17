import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-not-built',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <p class="label-caps text-text-muted">Not built yet</p>
      <p class="mt-2 max-w-prose text-sm text-text-body">
        This screen is part of the plan but has no UI yet. The dashboard is the one built screen.
      </p>
    </div>
  `,
})
export class NotBuilt {}
