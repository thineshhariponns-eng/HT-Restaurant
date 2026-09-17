import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClientStage } from '../../../core/models/client';
import { ClientsStore } from '../../../core/services/clients-store';
import { clientAdminHost } from '../../../core/utils/domain';

const STAGE_LABEL: Record<ClientStage, string> = {
  new: 'New',
  onboarding: 'Onboarding',
  development: 'Development',
  review: 'QA Review',
  production: 'Production',
};

const STAGE_DOT: Record<ClientStage, string> = {
  new: 'bg-status-new',
  onboarding: 'bg-status-onboarding',
  development: 'bg-status-development',
  review: 'bg-status-review',
  production: 'bg-status-production',
};

/** The onboarding checklist, in order. */
const STEPS = [
  'Client created',
  'Domain configured',
  'Customer UI',
  'Admin UI',
  'QA review',
  'Production',
] as const;

/** How many checklist steps each stage has signed off. */
const STEPS_DONE: Record<ClientStage, number> = {
  new: 1,
  onboarding: 2,
  development: 3,
  review: 5,
  production: 6,
};

const DATE = new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

@Component({
  selector: 'app-client-detail',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './client-detail.html',
})
export class ClientDetail {
  /** Bound from the :id route parameter. */
  readonly id = input.required<string>();

  private readonly store = inject(ClientsStore);

  protected readonly client = computed(() => this.store.byId(this.id()));

  protected readonly steps = computed(() => {
    const client = this.client();
    const done = client ? STEPS_DONE[client.stage] : 0;
    return STEPS.map((label, index) => ({ label, done: index < done }));
  });

  protected readonly domains = computed(() => {
    const client = this.client();
    if (!client) return [];
    /** The admin host only exists once the domain step is signed off. */
    const configured = STEPS_DONE[client.stage] >= 2;
    return [
      { host: client.domain, type: 'Customer', status: configured ? 'Configured' : 'Pending' },
      { host: clientAdminHost(client), type: 'Admin', status: configured ? 'Configured' : 'Pending' },
    ];
  });

  protected stageLabel(stage: ClientStage): string {
    return STAGE_LABEL[stage];
  }

  protected stageDot(stage: ClientStage): string {
    return STAGE_DOT[stage];
  }

  protected date(isoDate: string): string {
    return DATE.format(new Date(isoDate));
  }
}
