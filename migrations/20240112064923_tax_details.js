/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("tax_details", function (table) {
    table.uuid("id").primary();
    table
      .uuid("company_id")
      .references("id")
      .inTable("supplier_details")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table.string("gstno", 255).nullable();
    table.date("gstRegDate").nullable();
    table.string("msmeImage", 255).nullable();
    table.string("gstImage", 255).nullable();
    table.string("cancelledChequeImage", 255).nullable();
    table.string("panCardImage", 255).nullable();
    table.string("pfAttachment", 255).nullable();
    table.string("otherAttachments", 255).nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("tax_details");
}
