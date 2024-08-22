export function up (knex) {
  return knex.schema.createTable("grns", function (table) {
    table.increments("id").primary();
    table.text("asn_id").notNullable();
    table.text("poNo").notNullable();
    table.text("grnUniqueId").notNullable();
    table.text("postingDate").notNullable();
    table.json("item").notNullable();
    table.text("documentDate").notNullable();
    table.text("companyCode").notNullable();
    table.text("batchNo").notNullable();
    table.text("grnCode").nullable();
    table.text("grnYear").nullable();
    table.json("grnItem").nullable();
    table.text("grnStatus").nullable();
    table.timestamp("grnTime").nullable();
    table.string("modifiedBy",255).nullable();
    table.dateTime("created_at").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("grns");
}
