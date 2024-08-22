/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("departments", function (table) {
    table
      .foreign("company_id")
      .references("id")
      .inTable("companies")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("departments", function (table) {
    table.dropForeign(["company_id"]);
    table.dropColumn("company_id");
  });
}
