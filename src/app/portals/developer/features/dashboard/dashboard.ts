import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MOCK_ACTIVITY } from '../../core/data/mock-activity';
import { ActivityEntry, ClientStage } from '../../core/models/client';
import { ClientsStore } from '../../core/services/clients-store';

const STAGE_LABEL: Record<ClientStage, string> = {
  new: 'New',
  onboarding: 'Onboarding',
  development: 'Development',
  review: 'Review',
  production: 'Production',
};

/** Pipeline order, as the progress panel lists it. */
const STAGE_ORDER: ClientStage[] = ['new', 'onboarding', 'development', 'review', 'production'];

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly store = inject(ClientsStore);

  private readonly clients = this.store.clients;

  protected readonly activity = signal<ActivityEntry[]>(MOCK_ACTIVITY);

  protected readonly stats = computed(() => {
    const all = this.clients();
    return [
      { label: 'Total clients', value: all.length },
      { label: 'Onboarding', value: this.countOf('onboarding') },
      { label: 'Development', value: this.countOf('development') },
      { label: 'Live', value: this.countOf('production') },
    ];
  });

  /** Newest activity first; the overview shows only the top slice. */
  protected readonly overview = computed(() =>
    [...this.clients()].sort((a, b) => b.updatedOn.localeCompare(a.updatedOn)).slice(0, 5),
  );

  protected readonly pipeline = computed(() => {
    const total = this.clients().length;
    return STAGE_ORDER.map((stage) => {
      const count = this.countOf(stage);
      return {
        stage,
        label: STAGE_LABEL[stage],
        count,
        share: total === 0 ? 0 : Math.round((count / total) * 100),
      };
    });
  });

  protected stageLabel(stage: ClientStage): string {
    return STAGE_LABEL[stage];
  }

  /** Two digits, so the figures line up as a row of cards. */
  protected pad(value: number): string {
    return value.toString().padStart(2, '0');
  }

  private countOf(stage: ClientStage): number {
    return this.clients().filter((client) => client.stage === stage).length;
  }
}
