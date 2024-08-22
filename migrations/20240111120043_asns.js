export function up (knex) {
  return knex.schema.createTable("asns", function (table) {
    table.increments("id").primary();
    table.string("departmentId", 36).nullable();
    table.string("poNo", 255).nullable();
    table.string("poDate", 20).nullable();
    table.string("asnNo", 255).nullable();
    table.string("plantId", 36).nullable();
    table.string("supplierId", 36).nullable();
    table.string("dispatchDate", 20).nullable();
    table.string("type", 255).nullable();
    table.string("carrier", 255).nullable();
    table.text("lineItems").nullable();
    table
      .enum("status", [
        "materialShipped",
        "materialGateInward",
        "materialReceived",
        "qualityApproved",
        "invoiced",
        "partiallyPaid",
        "fullyPaid",
        "unpaid",
        "requested",
        "accepted",
        "cancelled",
        "partiallyReceived",
      ])
      .nullable()
      .defaultTo("materialShipped");
    table.string("gst", 50).nullable();
    table.string("pan", 50).nullable();
    table.string("gstInvoiceNumber", 255).nullable();
    table.text("shipToAddress").nullable();
    table.text("billToAddress").nullable();
    table.string("remarks", 255).nullable();
    table.text("file").nullable();
    table.string("eWayBillNo", 255).nullable();
    table.string("irnNo", 255).nullable();
    table.string("qrcode", 255).nullable();
    table.enum("invoiceType", ["parkInvoiced", "postInvoiced"]).nullable();
    table.timestamp("baseLineDate").nullable();
    table.integer("grnId", 10).unsigned().nullable();
    table.json("sesId").notNullable();
    table.integer("giId", 10).unsigned().nullable();
    table.integer("storageLocation", 10).unsigned().nullable();
    table.text("companyPAN").nullable();
    table.text("companyGST").nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now()).notNullable();
    table
      .timestamp("updatedAt")
      .nullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("asns");
}
