export function up (knex) {
  return knex.schema.createTable("purchase_orders_list", function (table) {
    table.increments("id").primary();
    table.text("supplierId").notNullable();
    table.text("poNumber").notNullable();
    table.string("modifiedBy",255).nullable();
    table.timestamps(true, true);
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("purchase_orders_list");
}
