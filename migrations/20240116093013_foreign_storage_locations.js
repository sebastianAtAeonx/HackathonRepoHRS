/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("storage_locations", function (table) {
    table
      .foreign("plantId")
      .references("id")
      .inTable("plants")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("storage_locations", function (table) {
    table.dropForeign("plantId");
    table.dropColumn("plantId");
  });
}
