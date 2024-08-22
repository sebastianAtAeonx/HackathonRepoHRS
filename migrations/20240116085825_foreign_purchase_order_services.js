/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("purchase_order_services", function (table) {
    table
      .foreign("po_id")
      .references("id")
      .inTable("purchase_orders")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("purchase_order_services", function (table) {
    table.dropForeign(["po_id"]);
    table.dropColumn("po_id");
  });
}
