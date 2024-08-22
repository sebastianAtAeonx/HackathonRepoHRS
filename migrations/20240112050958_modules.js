/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("modules", function (table) {
    table.increments("id").primary();
    table.string("module_key", 255).notNullable();
    table
      .enu("status", ["0", "1"])
      .notNullable()
      .defaultTo("1")
      .comment("0 - INACTIVE, 1 - ACTIVE");
      table.timestamp("created_at").nullable().defaultTo(knex.fn.now());
      table.string("modifiedBy",255).nullable();
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
  return knex.schema.dropTable("modules");
}
