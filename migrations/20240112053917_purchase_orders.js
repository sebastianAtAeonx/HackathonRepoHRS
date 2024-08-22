export function up (knex) {
  return knex.schema.createTable("purchase_orders", function (table) {
    table.increments("id").primary();
    table.text("poNo").notNullable();
    table.text("supplierId").notNullable();
    table.json("poItems").notNullable();
    table.string("modifiedBy",255).nullable();
    table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
    table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("purchase_orders");
}
