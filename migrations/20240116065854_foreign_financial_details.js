/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("financial_details", function (table) {
    table
      .foreign("company_id")
      .references("id")
      .inTable("supplier_details")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    // table
    //   .foreign("currency")
    //   .references("id")
    //   .inTable("currencies")
    //   .onDelete("NO ACTION")
    //   .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("financial_details", function (table) {
    table.dropForeign(["company_id"]);
    table.dropColumn("company_id");
  });
}
