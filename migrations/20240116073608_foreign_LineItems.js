/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("LineItems", function (table) {
    table
      .foreign("poNo")
      .references("poNo")
      .inTable("PurchaseOrders")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("LineItems", function (table) {
    table.dropForeign(["poNo"]);
    table.dropColumn("poNo");
  });
}
