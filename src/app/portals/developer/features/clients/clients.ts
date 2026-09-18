import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Client, ClientStage } from '../../core/models/client';
import { ClientsStore } from '../../core/services/clients-store';
import { clientAdminHost } from '../../core/utils/domain';

/** Short codes, so the status column stays one line on a phone. */
const STAGE_CODE: Record<ClientStage, string> = {
  new: 'New',
  onboarding: 'Onboard',
  development: 'Dev',
  review: 'Review',
  production: 'Live',
};

const STAGE_TEXT: Record<ClientStage, string> = {
  new: 'text-text-muted',
  onboarding: 'text-status-onboarding',
  development: 'text-status-development',
  review: 'text-status-review',
  production: 'text-status-production',
};

interface ClientRow extends Client {
  adminDomain: string;
}

@Component({
  selector: 'app-clients',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './clients.html',
})
export class Clients {
  private readonly store = inject(ClientsStore);

  private readonly all = computed<ClientRow[]>(() =>
    this.store.clients().map((client) => ({ ...client, adminDomain: clientAdminHost(client) })),
  );

  protected readonly search = signal('');

  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.all();
    return this.all().filter((row) =>
      `${row.name} ${row.domain} ${row.adminDomain}`.toLowerCase().includes(term),
    );
  });

  protected stageCode(stage: ClientStage): string {
    return STAGE_CODE[stage];
  }

  protected stageText(stage: ClientStage): string {
    return STAGE_TEXT[stage];
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}
