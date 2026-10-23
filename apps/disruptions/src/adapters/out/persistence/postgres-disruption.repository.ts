import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import type { DisruptionRepository } from '../../../application/ports/disruption-repository.port';
import { Disruption, type DisruptionStatus, type Severity } from '../../../domain/disruption';

interface DisruptionRow {
  id: string;
  line_ids: string[];
  severity: Severity;
  message: string;
  status: DisruptionStatus;
  starts_at: Date;
  ends_at: Date | null;
  declared_at: Date;
  published_at: Date | null;
}

/** Adapter de sortie PostgreSQL (base "operations", propriété exclusive du service : ARC-001). */
export class PostgresDisruptionRepository implements DisruptionRepository, OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 5 });
  }

  async onModuleInit(): Promise<void> {
    // Schéma créé au démarrage pour le squelette ; à remplacer par des migrations versionnées.
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS disruptions (
        id           uuid PRIMARY KEY,
        line_ids     text[]      NOT NULL,
        severity     text        NOT NULL,
        message      text        NOT NULL,
        status       text        NOT NULL,
        starts_at    timestamptz NOT NULL,
        ends_at      timestamptz,
        declared_at  timestamptz NOT NULL,
        published_at timestamptz
      )`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async save(disruption: Disruption): Promise<void> {
    const s = disruption.toSnapshot();
    await this.pool.query(
      `INSERT INTO disruptions (id, line_ids, severity, message, status, starts_at, ends_at, declared_at, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         line_ids = EXCLUDED.line_ids, severity = EXCLUDED.severity, message = EXCLUDED.message,
         status = EXCLUDED.status, starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at,
         published_at = EXCLUDED.published_at`,
      [s.id, s.lineIds, s.severity, s.message, s.status, s.startsAt, s.endsAt, s.declaredAt, s.publishedAt],
    );
  }

  async findById(id: string): Promise<Disruption | null> {
    const { rows } = await this.pool.query<DisruptionRow>('SELECT * FROM disruptions WHERE id = $1', [id]);
    return rows[0] ? toDomain(rows[0]) : null;
  }

  async findActiveAt(date: Date): Promise<Disruption[]> {
    const { rows } = await this.pool.query<DisruptionRow>(
      `SELECT * FROM disruptions
       WHERE status = 'published' AND starts_at <= $1 AND (ends_at IS NULL OR ends_at > $1)
       ORDER BY starts_at DESC`,
      [date],
    );
    return rows.map(toDomain);
  }
}

function toDomain(row: DisruptionRow): Disruption {
  return Disruption.restore({
    id: row.id,
    lineIds: row.line_ids,
    severity: row.severity,
    message: row.message,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    declaredAt: row.declared_at,
    publishedAt: row.published_at,
  });
}
