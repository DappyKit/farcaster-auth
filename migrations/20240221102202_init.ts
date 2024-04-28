import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('app', table => {
    table.bigInteger('fid').unsigned().notNullable()
    table.text('data', 'longtext').defaultTo('')
    table.boolean('is_active').defaultTo(false)
    table.string('frame_url', 255).notNullable()
    table.string('callback_url', 255).notNullable()
    // lowercased eth address without 0x
    table.string('signer_address', 40).notNullable().primary().unique()

    table.datetime('created_at').notNullable()
    table.datetime('updated_at').notNullable()
  })

  await knex.schema.createTable('authorization_request', table => {
    table.bigIncrements('id').primary().unsigned()
    table.string('app_signer_address', 40).notNullable()
    table.bigInteger('user_fid').unsigned().notNullable()

    table.string('status', 255).notNullable()
    table.string('challenge', 255).notNullable()
    table.string('user_signer_address', 40).notNullable()
    table.string('service_signature', 132).notNullable()
    table.string('proof_signature', 132).defaultTo('')

    table.datetime('created_at').notNullable()
    table.datetime('updated_at').notNullable()
    table.datetime('valid_until').notNullable()

    table.foreign('app_signer_address').references('app.signer_address')
  })

  await knex.schema.createTable('data_content', table => {
    table.string('user_address', 40).notNullable()
    table.string('app_address', 40).notNullable()
    table.text('data', 'longtext').notNullable()
    table.text('proof', 'longtext').notNullable()
    table.integer('nonce').notNullable().unsigned()
    table.string('hash', 64).notNullable()
    table.datetime('created_at').notNullable()
    table.datetime('updated_at').notNullable()

    table.primary(['user_address', 'app_address'])
    table.unique(['user_address', 'app_address'])
    table.index(['user_address', 'app_address'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('data_content')
  await knex.schema.dropTableIfExists('authorization_request')
  await knex.schema.dropTableIfExists('app')
}
