/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("item_categories", function (table) {
    table.increments("id").primary();
    table.integer("parent_id").notNullable();
    table.string("name", 255).notNullable();
    table.integer("subscriber_id").notNullable();
    table.enu("status", ["0", "1"]).notNullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .datetime("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("item_categories");
}
