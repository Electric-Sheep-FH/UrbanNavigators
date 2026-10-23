export const CHANNELS = ['push', 'email'] as const;
export type Channel = (typeof CHANNELS)[number];

/** Modèle : un voyageur demande à être prévenu des perturbations d'une ligne. */
export interface Subscription {
  id: string;
  userId: string;
  lineId: string;
  channel: Channel;
  createdAt: Date;
}
