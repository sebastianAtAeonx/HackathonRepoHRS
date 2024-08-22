/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("payment_terms", function (table) {
    table.increments("id").primary();
    table.string("code", 50).nullable();
    table.string("name", 50).nullable();
    table.enu("status", ["1", "0"]).defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .nullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("payment_terms");
}
