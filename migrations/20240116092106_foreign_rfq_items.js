/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("rfq_items", function (table) {
    table
      .foreign("rfq_id")
      .references("id")
      .inTable("request_for_quotations")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("rfq_items", function (table) {
    table.dropForeign(["rfq_id"]);
    table.dropColumn("rfq_id");
  });
}
