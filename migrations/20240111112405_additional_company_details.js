/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable(
    "additional_company_details",
    function (table) {
      table.increments("id").primary();
      table.string("supplier_id", 36).notNullable();
      table.string("companies", 255);
      table.integer("reconciliation_ac", 10).unsigned().nullable();
      table.integer("vendor_class", 10).unsigned().nullable();
      table.integer("vendor_schema", 10).unsigned().nullable();
      table.integer("business_partner_groups", 10).unsigned().nullable();
      table.integer("payment_terms", 10).unsigned().nullable();
      table.text("itWitholding");
      table.integer("purchase_group", 10).unsigned().nullable();
      table.string("modifiedBy",255).nullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table
        .timestamp("updated_at")
        .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    }
  );
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTableIfExists("additional_company_details");
}
