/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("approval_timeline", function (table) {
    // table
    //   .foreign("supplier_id")
    //   .references("id")
    //   .inTable("supplier_details")
    //   .onDelete("NO ACTION")
    //   .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("approval_timeline", function (table) {
    // table.dropForeign(["supplier_id"]);
  });
}
