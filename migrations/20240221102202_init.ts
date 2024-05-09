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
    // challenge for the user to solve in the form of JSON string
    table.string('challenge', 255).notNullable()
    // the address which control user's FID
    table.string('user_main_address', 40).notNullable()
    // delegated address which created by 3rd party application for the user
    table.string('user_delegated_address', 40).notNullable().unique()
    // signature of 3rd party application to verify that it initiated the request for the delegated address
    table.string('service_signature', 132).notNullable()
    // signature of the Auth service after user has passed the challenge. Proof required to make action on the user's behalf.
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
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('data_content')
  await knex.schema.dropTableIfExists('authorization_request')
  await knex.schema.dropTableIfExists('app')
}
