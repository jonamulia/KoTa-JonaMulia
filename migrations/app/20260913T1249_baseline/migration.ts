#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5af9a7a3ba04db0919a5865787658bd9008873ae53c690b97dc07cb8a71482c6/contract';
import endContract from '../../snapshots/5af9a7a3ba04db0919a5865787658bd9008873ae53c690b97dc07cb8a71482c6/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'komisiLog',
        columns: [
          col('id_log', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_referensi', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id_user', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jenis_komisi', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nominal_masuk', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id_log'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'pembayaran',
        columns: [
          col('id_bayar', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_penagih', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_pesanan', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nominal', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('tanggal', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id_bayar'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'pesanan',
        columns: [
          col('id_nego', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_pesanan', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_sales', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nama_barang', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nama_klien', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('total_harga', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id_pesanan'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'potongan',
        columns: [
          col('id_potongan', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id_user', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jenis', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nominal', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('tanggal', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id_potongan'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('id_user', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', {
            notNull: true,
            default: lit('SALES'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('username', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id_user']),
          checkExpression(
            'user_role_check_a9af11a8',
            "\"role\" IN ('ADMIN', 'NEGO', 'SALES', 'PENAGIH')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_username_key',
        columns: ['username'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'komisiLog',
        index: 'komisiLog_id_user_idx_52684e74',
        columns: ['id_user'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pembayaran',
        index: 'pembayaran_id_penagih_idx_d0331a88',
        columns: ['id_penagih'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pembayaran',
        index: 'pembayaran_id_pesanan_idx_cba61da2',
        columns: ['id_pesanan'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pesanan',
        index: 'pesanan_id_nego_idx_66b843d2',
        columns: ['id_nego'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pesanan',
        index: 'pesanan_id_sales_idx_2e8e4f57',
        columns: ['id_sales'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'potongan',
        index: 'potongan_id_user_idx_52684e74',
        columns: ['id_user'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'komisiLog',
        foreignKey: {
          name: 'komisiLog_id_user_fkey',
          columns: ['id_user'],
          references: { schema: 'public', table: 'user', columns: ['id_user'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pembayaran',
        foreignKey: {
          name: 'pembayaran_id_pesanan_fkey',
          columns: ['id_pesanan'],
          references: { schema: 'public', table: 'pesanan', columns: ['id_pesanan'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pembayaran',
        foreignKey: {
          name: 'pembayaran_id_penagih_fkey',
          columns: ['id_penagih'],
          references: { schema: 'public', table: 'user', columns: ['id_user'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pesanan',
        foreignKey: {
          name: 'pesanan_id_sales_fkey',
          columns: ['id_sales'],
          references: { schema: 'public', table: 'user', columns: ['id_user'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pesanan',
        foreignKey: {
          name: 'pesanan_id_nego_fkey',
          columns: ['id_nego'],
          references: { schema: 'public', table: 'user', columns: ['id_user'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'potongan',
        foreignKey: {
          name: 'potongan_id_user_fkey',
          columns: ['id_user'],
          references: { schema: 'public', table: 'user', columns: ['id_user'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
