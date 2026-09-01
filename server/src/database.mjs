import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const migrationsDirectory = join(dirname(fileURLToPath(import.meta.url)), '../db/migrations')

export function getDatabaseConfig(env = process.env) {
    const production = env.NODE_ENV === 'production'
    return production
        ? { client: 'postgres', url: env.DATABASE_URL || '' }
        : { client: 'sqlite', url: env.DATABASE_URL || './data/interview.sqlite' }
}

export function listMigrations() {
    return readdirSync(migrationsDirectory)
        .filter(name => /^\d+_.+\.sql$/.test(name))
        .sort()
        .map(name => ({ name, path: join(migrationsDirectory, name) }))
}
