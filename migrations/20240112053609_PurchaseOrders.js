/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("PurchaseOrders", function (table) {
    table.string("poNo", 50).primary();
    table.date("podate");
    table.string("asnNo", 50);
    table.string("plantId", 50);
    table.string("supplierId", 50);
    table.date("deliveryDate");
    table.string("type", 50);
    table.string("carrier", 100);
    table.string("status", 50);
    table.string("gst", 50);
    table.string("pan", 50);
    table.string("irnNo", 50);
    table.string("gstInvoiceNumber", 50);
    table.text("shiptoaddress");
    table.text("billtoaddress");
    table.text("remarks");
    table.text("file");
    table.string("eWayBillNo", 50);
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("PurchaseOrders");
}
