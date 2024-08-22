/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("supplier_status", function (table) {
    table.foreign("supplier_id").references("id").inTable("supplier_details");
    table.foreign("user_id").references("id").inTable("users");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("supplier_status", function (table) {
    table.dropForeign("supplier_id");
    table.dropForeign("user_id");
    table.dropColumn("supplier_id");
    table.dropColumn("user_id");
  });
}
