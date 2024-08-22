export function up (knex) {
  return knex.schema.createTable("asnMaterialReceived", function (table) {
    table.increments("id").primary();
    table.integer("asn_id").nullable();
    table.string("departmentId", 255).nullable();
    table.string("poNo", 255).nullable();
    table.string("poDate", 255).nullable();
    table.string("asnNo", 255).nullable();
    table.string("plantId", 255).nullable();
    table.string("supplierId", 255).nullable();
    table.string("dispatchDate", 255).nullable();
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
        "partiallyReceived",
      ])
      .nullable()
      .defaultTo("materialShipped");
    table.string("gst", 50).nullable();
    table.string("pan", 50).nullable();
    table.string("irnNo", 255).nullable();
    table.string("gstInvoiceNumber", 255).nullable();
    table.text("shipToAddress").nullable();
    table.text("billToAddress").nullable();
    table.string("remarks", 255).nullable();
    table.text("file").nullable();
    table.string("eWayBillNo", 255).nullable();
    table.string("qrcode", 255).nullable();
    table.enum("invoiceType", ["parkInvoiced", "postInvoiced"]).nullable();
    table.timestamp("baseLineDate").nullable();
    table.integer("grnId", 10).unsigned().nullable();
    table.integer("giId", 10).unsigned().nullable();
    table.integer("storageLocation", 10).unsigned().nullable();
    table.text("companyPAN").nullable();
    table.text("companyGST").nullable();
    table.text("MaterialReceivedRemarks").nullable();
    table.text("MaterialGateInwardRemarks").nullable();
    table.text("QualityApprovedRemarks").nullable();
    table.text("InvoicedRemarks").nullable();
    table.text("vehicalDetails").nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("asnMaterialReceived");
}
