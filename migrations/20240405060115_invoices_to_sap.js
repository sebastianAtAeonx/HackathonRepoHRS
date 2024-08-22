export function up (knex) {
  return knex.schema.createTable("invoicesToSap", function (table) {
    table.increments("id").primary();
    table.string("poNo", 50).nullable();
    table.string("asn_id", 50).nullable();
    table.text("invoiceUniqueId").nullable();
    table.json("invoiceCode").nullable();
    table.text("postInvoiceCode").nullable();
    table.timestamp("parkTime").nullable();
    table.timestamp("postTime").nullable();
    table.json("park").nullable();
    table.json("post").nullable();
    table.text("header").nullable();
    table.text("items").nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("invoicesToSap");
}
