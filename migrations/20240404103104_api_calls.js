/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("api_calls", function (table) {
    table.increments("id").primary();
    table.string("controller", 255).nullable();
    table.string("route", 255).nullable();
    table.string("serviceName", 50).nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("api_calls");
}
