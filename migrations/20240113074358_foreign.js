/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("additional_company_details", function (table) {
    table
      .foreign("reconciliation_ac")
      .references("id")
      .inTable("reconciliation_ac")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table
      .foreign("vendor_class")
      .references("id")
      .inTable("vendor_class")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .foreign("business_partner_groups")
      .references("id")
      .inTable("business_partner_groups")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .foreign("payment_terms")
      .references("id")
      .inTable("payment_terms")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .foreign("vendor_schema")
      .references("id")
      .inTable("vendor_schemas")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .foreign("purchase_group")
      .references("id")
      .inTable("purchase_groups")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
    table
      .foreign("supplier_id")
      .references("id")
      .inTable("supplier_details")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("additional_company_details", function (table) {
    table.dropForeign(["reconciliation_ac"]);
    table.dropColumn("reconciliation_ac");
    table.dropForeign(["vendor_class"]);
    table.dropColumn("vendor_class");
    table.dropForeign(["business_partner_groups"]);
    table.dropColumn("business_partner_groups");
    table.dropForeign(["payment_terms"]);
    table.dropColumn("payment_terms");
    table.dropForeign(["vendor_schema"]);
    table.dropColumn("vendor_schema");
    table.dropForeign(["purchase_group"]);
    table.dropColumn("purchase_group");
    table.dropForeign(["supplier_id"]);
    table.dropColumn("supplier_id");
  });
}
