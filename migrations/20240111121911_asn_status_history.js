/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("asn_status_history", function (table) {
    table.increments("id").primary();
    table.integer("asnId").nullable();
    table.string("status", 255).defaultTo("materialShipped");
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .nullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTableIfExists("asn_status_history");
}
