/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("tds", function (table) {
    table.increments("id").primary();
    table.string("type", 50).nullable();
    table.string("code", 50).nullable();
    table.text("description").nullable();
    table.enum("status", ["1", "0"]).defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("tds");
}
