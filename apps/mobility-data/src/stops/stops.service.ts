import { Injectable, NotFoundException } from '@nestjs/common';
import type { Stop } from './stop.model';
import { StopsRepository } from './stops.repository';

const MAX_RESULTS = 20;

/** Logique métier de la recherche d'arrêts. */
@Injectable()
export class StopsService {
  constructor(private readonly repository: StopsRepository) {}

  /** Recherche insensible à la casse et aux accents : "hotel" trouve "Hôtel de Ville". */
  async search(query: string): Promise<Stop[]> {
    const needle = normalize(query);
    const stops = await this.repository.findAll();
    return stops.filter((stop) => normalize(stop.name).includes(needle)).slice(0, MAX_RESULTS);
  }

  async findOne(id: string): Promise<Stop> {
    const stop = await this.repository.findById(id);
    if (!stop) throw new NotFoundException(`Arrêt ${id} introuvable.`);
    return stop;
  }
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}
