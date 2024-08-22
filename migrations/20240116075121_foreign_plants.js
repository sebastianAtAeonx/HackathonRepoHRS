/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("plants", function (table) {
    table
      .foreign("company_code")
      .references("id")
      .inTable("companies")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("plants", function (table) {
    table.dropForeign(["company_code"]);
    table.dropColumn("company_code");
  });
}
