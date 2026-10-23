import { Injectable } from '@nestjs/common';
import type { Stop } from './stop.model';

/**
 * Accès aux données. Jeu d'essai en mémoire en attendant l'import GTFS (DATA-001) ;
 * à remplacer par l'ORM sur la base "mobility", avec un index de recherche plein texte.
 */
@Injectable()
export class StopsRepository {
  private readonly stops: Stop[] = [
    { id: 'S001', name: 'Gare Centrale', lat: 48.8443, lon: 2.3744, wheelchairBoarding: true },
    { id: 'S002', name: 'Hôtel de Ville', lat: 48.8565, lon: 2.3524, wheelchairBoarding: true },
    { id: 'S003', name: 'République', lat: 48.8675, lon: 2.3637, wheelchairBoarding: false },
    { id: 'S004', name: 'Université', lat: 48.8462, lon: 2.3447, wheelchairBoarding: true },
    { id: 'S005', name: 'Gare du Nord', lat: 48.8809, lon: 2.3553, wheelchairBoarding: true },
  ];

  async findAll(): Promise<Stop[]> {
    return this.stops;
  }

  async findById(id: string): Promise<Stop | null> {
    return this.stops.find((stop) => stop.id === id) ?? null;
  }
}
