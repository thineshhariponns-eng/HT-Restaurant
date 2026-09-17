import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Client, ClientStage } from '../../core/models/client';
import { ClientsStore } from '../../core/services/clients-store';
import { clientAdminHost } from '../../core/utils/domain';

const COLUMNS: { stage: ClientStage; label: string; accent: string }[] = [
  { stage: 'new', label: 'New', accent: 'bg-status-new' },
  { stage: 'onboarding', label: 'Onboarding', accent: 'bg-status-onboarding' },
  { stage: 'development', label: 'Development', accent: 'bg-status-development' },
  { stage: 'review', label: 'QA / Review', accent: 'bg-status-review' },
  { stage: 'production', label: 'Production', accent: 'bg-status-production' },
];

const STAGES = COLUMNS.map((column) => column.stage);

const DATE = new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' });

@Component({
  selector: 'app-deployments',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './deployments.html',
})
export class Deployments {
  private readonly store = inject(ClientsStore);

  protected readonly columns = computed(() =>
    COLUMNS.map((column) => ({
      ...column,
      clients: this.store.clients().filter((client) => client.stage === column.stage),
    })),
  );

  protected adminDomain(client: Client): string {
    return clientAdminHost(client);
  }

  protected updated(isoDate: string): string {
    return DATE.format(new Date(isoDate));
  }

  /** Two digits, so the column counts line up. */
  protected pad(value: number): string {
    return value.toString().padStart(2, '0');
  }

  protected drop(event: CdkDragDrop<ClientStage>, stage: ClientStage): void {
    if (event.previousContainer === event.container) return;
    this.store.moveTo(event.item.data as string, stage);
  }

  /** Keyboard path: shift a card one column left or right. */
  protected nudge(client: Client, direction: -1 | 1): void {
    const next = STAGES[STAGES.indexOf(client.stage) + direction];
    if (next) this.store.moveTo(client.id, next);
  }

  protected canNudge(client: Client, direction: -1 | 1): boolean {
    return STAGES[STAGES.indexOf(client.stage) + direction] !== undefined;
  }

  protected stageLabel(stage: ClientStage): string {
    return COLUMNS.find((column) => column.stage === stage)?.label ?? stage;
  }
}
