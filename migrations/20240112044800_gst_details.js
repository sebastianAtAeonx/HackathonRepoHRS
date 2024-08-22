/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("gst_details", function (table) {
    table.increments("id").primary();
    table.string("gst", 255).notNullable();
    table.string("trade_name", 255).notNullable();
    table.string("business_type", 255).notNullable();
    table.string("modifiedBy",255).nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .datetime("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.unique("gst");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("gst_details");
}
