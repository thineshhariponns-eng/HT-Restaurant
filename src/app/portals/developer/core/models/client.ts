/** Where a restaurant client sits in the consultant's delivery pipeline. */
export type ClientStage = 'new' | 'onboarding' | 'development' | 'review' | 'production';

export interface Client {
  id: string;
  /** Human-facing reference, shown on the detail page. */
  code: string;
  name: string;
  /** Branch or town, shown next to the name. */
  city: string;
  contact: string;
  contactEmail?: string;
  domain: string;
  /** Set when the admin host is not the default derived from the domain. */
  adminDomain?: string;
  stage: ClientStage;
  /** Build completion, 0-100. */
  progress: number;
  /** Account opened, as an ISO date string. */
  createdOn: string;
  /** Last activity, as an ISO date string. */
  updatedOn: string;
}

export interface ActivityEntry {
  id: string;
  /** 24-hour clock, as shown in the feed. */
  time: string;
  client: string;
  event: string;
}
