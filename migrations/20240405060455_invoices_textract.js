export function up(knex) {
  return knex.schema.createTable("invoices_textract", function (table) {
    table.increments("id").primary();
    table.text("invoiceName").notNullable();
    table.text("invoiceId").notNullable();
    table.text("poNo").notNullable();
    table.text("poType").notNullable();
    table.text("supplierId").notNullable();
    table.text("s3Name").notNullable();
    table.json("s3Namepdf").notNullable().comment("This is for pdf.");
    table.text("s3Path").notNullable();
    table.integer("sapInvoiceId", 10).nullable().unsigned();
    table.integer("sapGiId", 10).nullable().unsigned(); //new
    table.integer("sapGrnId", 10).nullable().unsigned();
    table.integer("sapSesId", 10).nullable().unsigned(); //new
    table.enum("status", ["0", "1"]).notNullable().defaultTo("1");
    table.json("textractResponse").nullable();
    table.text('file_hash').nullable();
    table.binary('file_data').nullable();
    table.string("modifiedBy", 255).nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("invoices_textract");
}
