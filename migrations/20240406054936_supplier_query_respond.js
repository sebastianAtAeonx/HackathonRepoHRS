export function up (knex) {
  return knex.schema.createTable("supplier_query_respond", function (table) {
    table.increments("id").primary();
    table.string("supplierId", 50).notNullable();
    table.integer("approverId").notNullable().defaultTo(0);
    table.text("query").notNullable();
    table.text("respond").notNullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("supplier_query_respond");
}
