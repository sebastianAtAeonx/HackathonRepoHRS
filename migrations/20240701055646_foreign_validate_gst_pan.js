/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("validateGST_PAN", function (table) {
    table
      .foreign("supplierId")
      .references("id")
      .inTable("supplier_details")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("validateGST_PAN", function (table) {
    table.dropForeign(["supplierId"]);
  });
}
