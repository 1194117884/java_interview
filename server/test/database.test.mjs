import assert from 'node:assert/strict'
import test from 'node:test'
import { getDatabaseConfig, listMigrations } from '../src/database.mjs'

test('database config defaults to SQLite and supports PostgreSQL in production', () => {
    assert.deepEqual(getDatabaseConfig({}), { client: 'sqlite', url: './data/interview.sqlite' })
    assert.deepEqual(getDatabaseConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgres://db/interview' }), { client: 'postgres', url: 'postgres://db/interview' })
})

test('migration registry returns ordered schema files', () => {
    const migrations = listMigrations()
    assert.ok(migrations.length >= 1)
    assert.equal(migrations[0].name, '001_initial.sql')
})
