/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("fields_config", function (table) {
    table.increments("id").primary();
    table.string("subscriber_id", 50).nullable();
    table.string("key", 255).notNullable();
    table.string("field_type", 255).notNullable();
    table.string("module_name", 255).notNullable();
    table.string("group_name", 255).notNullable();
    table.enum("required", ["0", "1"]).notNullable();
    table.string("display_name", 255).nullable();
    table.integer("panel_id").notNullable();
    table.enum("display", ["0", "1"]).notNullable();
    table.enum("is_primary", ["0", "1"]).defaultTo("0");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("fields_config");
}
