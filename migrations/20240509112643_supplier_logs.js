export function up (knex) {
  return knex.schema.createTable("supplier_logs", function (table) {
    table.increments("id").primary().unsigned();
    table.string("supplierId", 36).nullable().collate("utf8mb3_general_ci");
    table.string("gstNo", 15).nullable().collate("utf8mb3_general_ci");
    table.string("panNo", 10).nullable().collate("utf8mb3_general_ci");
    table.string("supplierName", 255).nullable().collate("utf8mb3_general_ci");
    table.string("email", 255).nullable().collate("utf8mb3_general_ci");
    table.string("status", 10).nullable().collate("utf8mb3_general_ci");
    table.timestamp("onDate").nullable();
    table.string("byWhom", 50).nullable().collate("utf8mb3_general_ci");
    table.text("remarks").nullable().collate("utf8mb3_general_ci");
    table.text("updatedFields").nullable().collate("utf8mb3_general_ci");
    table.text("oldFields").nullable().collate("utf8mb3_general_ci");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("supplier_logs");
}
