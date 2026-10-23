import { Disruption, type DeclareDisruptionInput } from './disruption';
import { InvalidDisruptionError, InvalidTransitionError } from './domain.errors';

const NOW = new Date('2026-11-02T08:00:00Z');

function declare(overrides: Partial<DeclareDisruptionInput> = {}): Disruption {
  return Disruption.declare(
    {
      id: 'd-1',
      lineIds: ['L1'],
      severity: 'warning',
      message: 'Trafic perturbé entre Gare Centrale et République.',
      startsAt: new Date('2026-11-02T07:30:00Z'),
      endsAt: new Date('2026-11-02T12:00:00Z'),
      ...overrides,
    },
    NOW,
  );
}

describe('Disruption', () => {
  describe('déclaration', () => {
    it('crée un brouillon et dédoublonne les lignes', () => {
      const snapshot = declare({ lineIds: ['L1', ' L1 ', 'L2'] }).toSnapshot();

      expect(snapshot.status).toBe('draft');
      expect(snapshot.lineIds).toEqual(['L1', 'L2']);
      expect(snapshot.declaredAt).toEqual(NOW);
    });

    it.each([
      ['sans ligne', { lineIds: [] }],
      ['avec une gravité inconnue', { severity: 'apocalyptique' }],
      ['avec un message vide', { message: '   ' }],
      ['avec un message trop long', { message: 'x'.repeat(281) }],
      ['avec une date invalide', { startsAt: new Date('pas une date') }],
      ['qui finit avant de commencer', { endsAt: new Date('2026-11-02T07:00:00Z') }],
    ])('refuse une perturbation %s', (_label, overrides) => {
      expect(() => declare(overrides)).toThrow(InvalidDisruptionError);
    });
  });

  describe('publication', () => {
    it('publie un brouillon et émet un événement de domaine', () => {
      const disruption = declare();

      const event = disruption.publish(NOW);

      expect(event).toMatchObject({ type: 'DisruptionPublished', disruptionId: 'd-1', lineIds: ['L1'] });
      expect(disruption.toSnapshot()).toMatchObject({ status: 'published', publishedAt: NOW });
    });

    it('refuse de publier deux fois', () => {
      const disruption = declare();
      disruption.publish(NOW);

      expect(() => disruption.publish(NOW)).toThrow(InvalidTransitionError);
    });

    it('refuse de publier une perturbation déjà terminée', () => {
      const disruption = declare({ endsAt: new Date('2026-11-02T07:45:00Z') });

      expect(() => disruption.publish(NOW)).toThrow(InvalidTransitionError);
    });
  });

  describe('visibilité', () => {
    it("n'est active que publiée et pendant sa période", () => {
      const disruption = declare();
      expect(disruption.isActiveAt(NOW)).toBe(false);

      disruption.publish(NOW);

      expect(disruption.isActiveAt(NOW)).toBe(true);
      expect(disruption.isActiveAt(new Date('2026-11-02T12:00:00Z'))).toBe(false);
    });
  });
});
