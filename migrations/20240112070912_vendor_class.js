/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("vendor_class", function (table) {
    table.increments("id").unsigned().notNullable().primary();
    table.string("code", 50);
    table.string("name", 255);
    table.enum("status", ["1", "0"]).defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.dateTime("created_at").defaultTo(knex.fn.now());
    
    table
      .dateTime("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("vendor_class");
}
