import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('app', table => {
    table.bigInteger('fid').unsigned().primary().unique().notNullable()
    table.string('username', 255).notNullable()
    table.string('display_name', 255).notNullable()
    table.string('profile_image', 255).notNullable()
    table.text('data', 'longtext').defaultTo('')
    table.boolean('is_active').defaultTo(false)
    table.string('frame_url', 255).notNullable()
    table.string('callback_url', 255).notNullable()

    table.datetime('created_at').notNullable()
    table.datetime('updated_at').notNullable()
  })

  await knex.schema.createTable('authorization_request', table => {
    table.bigIncrements('id').primary().unsigned()
    table.bigInteger('app_fid').unsigned().notNullable()
    table.bigInteger('user_fid').unsigned().notNullable()

    table.string('status', 255).notNullable()
    table.string('challenge', 255).notNullable()

    table.datetime('created_at').notNullable()
    table.datetime('updated_at').notNullable()
    table.datetime('valid_until').notNullable()

    table.foreign('app_fid').references('app.fid')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('authorization_request')
  await knex.schema.dropTableIfExists('app')
}
