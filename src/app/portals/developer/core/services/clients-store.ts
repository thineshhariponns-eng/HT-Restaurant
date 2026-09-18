import { Injectable, computed, signal } from '@angular/core';
import { MOCK_CLIENTS } from '../data/mock-clients';
import { Client, ClientStage } from '../models/client';

export interface NewClient {
  name: string;
  city: string;
  contact: string;
  contactEmail: string;
  domain: string;
  adminDomain: string;
}

/** In-memory client list. Demo only; everything resets on reload. */
@Injectable({ providedIn: 'root' })
export class ClientsStore {
  private readonly list = signal<Client[]>(MOCK_CLIENTS);

  readonly clients = this.list.asReadonly();
  readonly count = computed(() => this.list().length);

  byId(id: string): Client | null {
    return this.list().find((client) => client.id === id) ?? null;
  }

  countOf(stage: ClientStage): number {
    return this.list().filter((client) => client.stage === stage).length;
  }

  /** Moves a client to another stage and stamps today as its last activity. */
  moveTo(id: string, stage: ClientStage): void {
    const today = new Date().toISOString().slice(0, 10);
    this.list.update((clients) =>
      clients.map((client) =>
        client.id === id ? { ...client, stage, updatedOn: today } : client,
      ),
    );
  }

  /** Appends a client at the New stage and hands back the stored record. */
  add(input: NewClient): Client {
    const today = new Date().toISOString().slice(0, 10);
    const next = this.list().length + 1;
    const client: Client = {
      id: `c-${next}`,
      code: `CL-${next.toString().padStart(3, '0')}`,
      name: input.name,
      city: input.city,
      contact: input.contact,
      contactEmail: input.contactEmail,
      domain: input.domain,
      adminDomain: input.adminDomain,
      stage: 'new',
      progress: 10,
      createdOn: today,
      updatedOn: today,
    };
    this.list.update((clients) => [client, ...clients]);
    return client;
  }
}
