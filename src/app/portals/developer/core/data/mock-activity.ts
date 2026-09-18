import { ActivityEntry } from '../models/client';

/** Most recent first. Demo feed; resets on reload. */
export const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: 'a-1', time: '21:05', client: 'Spice Garden', event: 'Admin hostname configured' },
  { id: 'a-2', time: '20:42', client: 'Coastal Bites', event: 'Moved to Development' },
  { id: 'a-3', time: '19:30', client: 'HT Restaurant', event: 'Onboarding completed' },
  { id: 'a-4', time: '18:12', client: 'Urban Tiffin', event: 'Menu import reviewed' },
  { id: 'a-5', time: '17:04', client: 'Green Leaf Cafe', event: 'Sent to Review' },
];
