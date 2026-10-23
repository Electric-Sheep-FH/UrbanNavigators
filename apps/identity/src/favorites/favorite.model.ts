export const FAVORITE_KINDS = ['stop', 'line'] as const;
export type FavoriteKind = (typeof FAVORITE_KINDS)[number];

/** Modèle : un arrêt ou une ligne mis en favori par un voyageur (données minimales, PRIV-001). */
export interface Favorite {
  id: string;
  userId: string;
  kind: FavoriteKind;
  targetId: string;
  label: string;
  createdAt: Date;
}
