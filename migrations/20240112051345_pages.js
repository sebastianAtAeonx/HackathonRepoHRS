/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("pages", function (table) {
    table.string("id", 36).notNullable().defaultTo("");
    table.string("name", 255).notNullable();
    table.string("group_id", 36).notNullable().defaultTo("0");
    table.string("pannel_id", 36).notNullable().defaultTo("0");
    table.enu("status", ["1", "0"]).notNullable().defaultTo("1");
    table.enu("is_primary", ["1", "0"]).notNullable().defaultTo("1");
    table.string("route", 255).notNullable();
    table.integer("sort").nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.primary("id");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("pages");
}
