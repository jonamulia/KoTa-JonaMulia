#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/38af3a6e425bcdfc154dd2bf024c2375b170395de60272520ccb3d0a3d09322e/contract';
import startContract from '../../snapshots/38af3a6e425bcdfc154dd2bf024c2375b170395de60272520ccb3d0a3d09322e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/dbc77e86c685a48e11b937bfd8090576ce072c4a70cf9542040d325b32382f98/contract';
import endContract from '../../snapshots/dbc77e86c685a48e11b937bfd8090576ce072c4a70cf9542040d325b32382f98/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'pesanan',
        column: col('tanggal', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
