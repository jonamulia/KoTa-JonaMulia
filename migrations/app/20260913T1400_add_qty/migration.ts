#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/38af3a6e425bcdfc154dd2bf024c2375b170395de60272520ccb3d0a3d09322e/contract';
import endContract from '../../snapshots/38af3a6e425bcdfc154dd2bf024c2375b170395de60272520ccb3d0a3d09322e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/5af9a7a3ba04db0919a5865787658bd9008873ae53c690b97dc07cb8a71482c6/contract';
import startContract from '../../snapshots/5af9a7a3ba04db0919a5865787658bd9008873ae53c690b97dc07cb8a71482c6/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  placeholder,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'pembayaran' }),
      this.dropColumn({ schema: 'public', table: 'pesanan', column: 'nama_barang' }),
      this.dropColumn({ schema: 'public', table: 'pesanan', column: 'nama_klien' }),
      this.createTable({
        schema: 'public',
        table: 'barang',
        columns: [
          col('harga', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_barang', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nama_barang', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id_barang'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'klien',
        columns: [
          col('alamat', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id_klien', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('kontak', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id_klien'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'penagihan',
        columns: [
          col('catatan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id_penagih', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_penagihan', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_pesanan', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nominal', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('percobaan_ke', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tanggal', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id_penagihan'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'pesanan',
        column: col('qty', 'int4', {
          notNull: true,
          default: lit(1),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'pesanan',
        column: col('id_barang', 'int4', { default: lit(1), codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.setNotNull({ schema: 'public', table: 'pesanan', column: 'id_barang' }),
      this.addColumn({
        schema: 'public',
        table: 'pesanan',
        column: col('id_klien', 'int4', { default: lit(1), codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.setNotNull({ schema: 'public', table: 'pesanan', column: 'id_klien' }),
      this.createIndex({
        schema: 'public',
        table: 'penagihan',
        index: 'penagihan_id_penagih_idx_d0331a88',
        columns: ['id_penagih'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'penagihan',
        index: 'penagihan_id_pesanan_idx_cba61da2',
        columns: ['id_pesanan'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pesanan',
        index: 'pesanan_id_barang_idx_1a8610ff',
        columns: ['id_barang'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pesanan',
        index: 'pesanan_id_klien_idx_a043e45c',
        columns: ['id_klien'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'penagihan',
        foreignKey: {
          name: 'penagihan_id_pesanan_fkey',
          columns: ['id_pesanan'],
          references: { schema: 'public', table: 'pesanan', columns: ['id_pesanan'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'penagihan',
        foreignKey: {
          name: 'penagihan_id_penagih_fkey',
          columns: ['id_penagih'],
          references: { schema: 'public', table: 'user', columns: ['id_user'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pesanan',
        foreignKey: {
          name: 'pesanan_id_barang_fkey',
          columns: ['id_barang'],
          references: { schema: 'public', table: 'barang', columns: ['id_barang'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pesanan',
        foreignKey: {
          name: 'pesanan_id_klien_fkey',
          columns: ['id_klien'],
          references: { schema: 'public', table: 'klien', columns: ['id_klien'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
