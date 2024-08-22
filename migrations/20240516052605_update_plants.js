/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("plants", function (table) {
    table.bigInteger("country_key", 19).unsigned().nullable().alter();
    table.integer("state_code", 10).unsigned().nullable().alter();
    table
      .foreign("country_key")
      .references("id")
      .inTable("countries")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .foreign("state_code")
      .references("id")
      .inTable("states")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

export function down(knex) {
  return knex.schema.alterTable("plants", function (table) {
    table.dropForeign(["country_key"]);
    table.dropForeign(["state_code"]);
  });
}
