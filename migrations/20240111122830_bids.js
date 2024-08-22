/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("bids", function (table) {
    table.increments("id").primary();
    table.integer("auction_id", 10).unsigned().notNullable();
    table.string("supplier_id", 36).notNullable().defaultTo("");
    table.float("bid_amount").notNullable();
    table.datetime("bid_date").notNullable();
    table.enu("status", ["0", "1"]).notNullable();
    table.string("modifiedBy",255).nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .datetime("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    //table.foreign('auction_id').references('id').inTable('auctions');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTableIfExists("bids");
}
