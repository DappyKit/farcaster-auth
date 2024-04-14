import knex from 'knex'
import config from '../../knexfile'

export const db = knex(process.env.ENV_TYPE === 'production' ? config.production : config.development)
