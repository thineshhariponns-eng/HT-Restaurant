import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ClientsStore } from '../../core/services/clients-store';
import { clientAdminHost } from '../../core/utils/domain';

export type DomainType = 'Customer' | 'Admin';

export interface DomainRow {
  host: string;
  client: string;
  type: DomainType;
}

@Component({
  selector: 'app-domains',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './domains.html',
})
export class Domains {
  private readonly store = inject(ClientsStore);

  protected readonly rows = computed<DomainRow[]>(() =>
    this.store.clients().flatMap((client) => [
      { host: client.domain, client: client.name, type: 'Customer' as const },
      { host: clientAdminHost(client), client: client.name, type: 'Admin' as const },
    ]),
  );

  /** Turns to 'copied' for a moment after a successful copy. */
  protected readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');

  protected async copyAll(): Promise<void> {
    const text = this.rows().map((row) => `127.0.0.1\t${row.host}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      this.copyState.set('copied');
      setTimeout(() => this.copyState.set('idle'), 2000);
    } catch {
      this.copyState.set('failed');
    }
  }
}
