import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** A coarse "now" for order ages. Ticks every 30 seconds; UI only, no backend clock. */
@Injectable({ providedIn: 'root' })
export class Clock {
  private readonly nowSignal = signal(Date.now());
  readonly now = this.nowSignal.asReadonly();

  constructor() {
    const id = setInterval(() => this.nowSignal.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
