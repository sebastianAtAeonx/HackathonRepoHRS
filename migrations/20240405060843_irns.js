export function up (knex) {
  return knex.schema.createTable("irns", function (table) {
    table.increments("id").primary();
    table
      .string("asnNo", 50)
      .notNullable()
      .defaultTo("0")
      .collate("utf8_general_ci");
    table.string("user_gstin", 15).notNullable().collate("utf8_general_ci");
    table.string("data_source", 10).notNullable().collate("utf8_general_ci");
    table.text("transaction_details").notNullable().collate("utf8_general_ci");
    table.text("document_details").notNullable().collate("utf8_general_ci");
    table.text("seller_details").notNullable().collate("utf8_general_ci");
    table.text("buyer_details").notNullable().collate("utf8_general_ci");
    table.text("dispatch_details").notNullable().collate("utf8_general_ci");
    table.text("ship_details").notNullable().collate("utf8_general_ci");
    table.text("export_details").notNullable().collate("utf8_general_ci");
    table.text("payment_details").notNullable().collate("utf8_general_ci");
    table.text("reference_details").notNullable().collate("utf8_general_ci");
    table
      .text("additional_document_details")
      .notNullable()
      .collate("utf8_general_ci");
    table.text("ewaybill_details").notNullable().collate("utf8_general_ci");
    table.text("value_details").notNullable().collate("utf8_general_ci");
    table.text("item_list").notNullable().collate("utf8_general_ci");
    table
      .string("AckNo", 50)
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");
    table
      .string("AckDt", 50)
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");
    table.text("irnNo").nullable().defaultTo(null).collate("utf8_general_ci");
    table
      .string("EwbNo", 50)
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");
    table
      .string("EwbDt", 50)
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");
    table
      .string("EwbValidTill", 50)
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");
    table
      .text("signedInvoice")
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");
    table
      .text("signedQrCode")
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");
    table
      .string("QRCodeUrl", 50)
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");
    table
      .string("EinvoicePdf", 50)
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");
    table
      .string("EwayBillPdf", 50)
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");
      table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("irns");
}
