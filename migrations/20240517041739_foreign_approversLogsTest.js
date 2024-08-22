/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("approversLogsTest", function (table) {
    // table
    //   .foreign("supplierId")
    //   .references("id")
    //   .inTable("supplier_details")
    //   .onDelete("NO ACTION")
    //   .onUpdate("cascade");
    // table
    //   .foreign("approverId")
    //   .references("id")
    //   .inTable("users")
    //   .onDelete("NO ACTION")
    //   .onUpdate("cascade");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("approversLogsTest", function (table) {
    // table.dropForeign(["supplierId"]);
    // table.dropForeign(["approverId"]);
  });
}
