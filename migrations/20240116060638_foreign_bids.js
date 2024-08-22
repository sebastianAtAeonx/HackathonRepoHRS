/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("bids", function (table) {
    table
      .foreign("auction_id")
      .references("id")
      .inTable("auctions")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("bids", function (table) {
    table.dropForeign(["auction_id"]);
    table.dropColumn("auction_id");
  });
}
