export function up (knex) {
  return knex.schema.createTable("poStock", function (table) {
    table.increments("id").primary();
    table.string("poNo", 255).nullable();
    table.json("poQty").notNullable();
    table.json("asnQty").notNullable();
    table.json("remaining").notNullable();
    table.string("modifiedBy",255).nullable();
    table.timestamps(true, true);
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("poStock");
}
