/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("page_group", function (table) {
    table.string("id", 36).notNullable().defaultTo("0");
    table.string("group_name", 255).notNullable();
    table.string("parent_id", 255).notNullable();
    table.string("pannel_id", 255).notNullable();
    table.enu("status", ["1", "0"]).notNullable().defaultTo("1");
    table.enu("can_modify", ["1", "0"]).notNullable().defaultTo("0");
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
  return knex.schema.dropTable("page_group");
}
