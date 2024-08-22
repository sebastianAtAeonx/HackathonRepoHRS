/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("items", function (table) {
    table.increments("id").primary();
    table.string("code", 50).notNullable();
    table.string("name", 255).notNullable();
    table.integer("category_id").notNullable();
    table.text("description").notNullable();
    table.string("unit_id", 36).notNullable();
    table.float("price").notNullable();
    table.enu("status", ["0", "1"]).notNullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .datetime("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.unique("code");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("items");
}
