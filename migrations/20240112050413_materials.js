export function up (knex) {
  return knex.schema.createTable("materials", function (table) {
    table.increments("id").primary();
    table.string("code", 255).notNullable();
    table.string("name", 255).notNullable();
    table.string("hsnCode", 255).notNullable();
    table.float("price").notNullable().defaultTo(0);
    table.float("tax").notNullable().defaultTo(0);
    table.text("plants").notNullable();
    table.text("description").notNullable();
    table.string("uom", 255).notNullable().defaultTo("");
    table.string("material_group", 255).notNullable().defaultTo("");
    table.text("storage_locations").notNullable();
    table.string("material_type", 255).notNullable().defaultTo("");
    table.enum("status", ["1", "0"]).notNullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamps(true, true);
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("materials");
}
