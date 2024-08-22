/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// table.integer("sapInvoiceId", 10).nullable().unsigned();
// table.integer("sapGrnId", 10).nullable().unsigned();

export function up(knex) {
  return knex.schema.alterTable("invoices_textract", function (table) {
    table
      .foreign("sapGrnId")
      .references("id")
      .inTable("grns")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
    table
      .foreign("sapInvoiceId")
      .references("id")
      .inTable("invoicesToSap")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
    table
      .foreign("sapGiId")
      .references("id")
      .inTable("gis")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
    table
      .foreign("sapSesId")
      .references("id")
      .inTable("ses")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("invoices_textract", function (table) {
    table.dropForeign("sapGrnId");
    table.dropForeign("sapInvoiceId");
    table.dropForeign("sapGiId");
    table.dropForeign("sapSesId");
  });
}
