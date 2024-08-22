/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("reconciliation_ac", function (table) {
    // Foreign key constraint
    table
      .foreign("company_id")
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
  return knex.schema.alterTable("reconciliation_ac", function (table) {
    table.dropForeign(["company_id"]);
    table.dropColumn("company_id");
  });
}
