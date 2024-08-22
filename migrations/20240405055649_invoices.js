export function up (knex) {
  return knex.schema.createTable("invoices", function (table) {
    table.increments("id").primary();
    table.string("asnNo", 255).notNullable().collate("utf8_general_ci");
    table.string("poNo", 50).nullable().collate("utf8_general_ci");
    table.string("invoiceCode", 50).nullable().collate("utf8_general_ci");
    table.string("postingDate", 255).notNullable().collate("utf8_general_ci");
    table.string("documentDate", 255).notNullable().collate("utf8_general_ci");
    table.string("reference", 255).notNullable().collate("utf8_general_ci");
    table.text("headerText").notNullable().collate("utf8_general_ci");
    table.string("companyCode", 255).notNullable().collate("utf8_general_ci");
    table.string("currency", 255).notNullable().collate("utf8_general_ci");
    table.string("baselineDate", 255).notNullable().collate("utf8_general_ci");
    table
      .string("totalInvoiceAmount", 255)
      .notNullable()
      .collate("utf8_general_ci");
    table
      .string("parkPostIdicator", 255)
      .notNullable()
      .collate("utf8_general_ci");
    table.text("items").notNullable().collate("utf8_general_ci");
    table
      .string("freightConditionCode", 255)
      .notNullable()
      .default("")
      .collate("utf8_general_ci");
    table
      .string("freightAmount", 255)
      .notNullable()
      .default("")
      .collate("utf8_general_ci");
      table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("invoices");
}
