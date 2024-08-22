/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("approval_hierarchy", function (table) {
    table.increments("id").primary();
    table.integer("subscriber_id", 10).unsigned().nullable();
    table.integer("role_id", 10).unsigned().nullable();
    table.integer("approval_hierarchy_level").nullable();
    table.text("approval_level_name");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists("approval_hierarchy");
}
