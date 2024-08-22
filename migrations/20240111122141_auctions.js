/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("auctions", function (table) {
    table.increments("id").primary();
    table.integer("subscriber_id", 10).unsigned().notNullable();
    table.string("plant_id", 36).notNullable();
    table.string("title", 255).notNullable();
    table.text("description").notNullable();
    table.datetime("start_date").defaultTo(knex.fn.now());
    table.datetime("end_date").defaultTo(knex.fn.now());
    table.float("min_bid").notNullable();
    table.enu("status", ["0", "1"]).notNullable();
    table.string("modifiedBy",255).nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .datetime("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    //
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTableIfExists("auctions");
}
