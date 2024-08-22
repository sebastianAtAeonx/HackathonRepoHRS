/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("minority_indicator", function (table) {
    table.increments("id").primary(); // Assuming "id" is an auto-incrementing primary key
    table.string("min_ind", 255).notNullable().defaultTo("");
    table.string("Description", 255).notNullable().defaultTo("");
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
export function down (knex) {
  return knex.schema.dropTable("minority_indicator");
}
