/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("LineItems", function (table) {
    table.increments("id").primary();
    table.string("poNo", 50).nullable();
    table.string("itemName", 100).nullable();
    table.integer("quantity").nullable();
    table.string("unit", 50).nullable();
    table.string("materialCode", 50).nullable();
    table.text("materialDescription");
    table.decimal("pricePerUnit", 10, 2).nullable();
    table.decimal("subTotal", 10, 2).nullable();
    table.string("hsnCode", 50).nullable();
    table.decimal("weight", 10, 2).nullable();
    table.string("dimension", 100).nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .nullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    //table.foreign('poNo').references('poNo').inTable('PurchaseOrders');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("LineItems");
}
