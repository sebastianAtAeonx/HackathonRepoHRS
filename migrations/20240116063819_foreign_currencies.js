/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("currencies", function (table) {
    table
      .foreign("country_key")
      .references("country_key")
      .inTable("countries")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("currencies", function (table) {
    table.dropForeign(["country_key"]);
    table.dropColumn("country_key");
  });
}
