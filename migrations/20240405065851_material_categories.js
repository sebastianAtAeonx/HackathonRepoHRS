export function up (knex) {
  return knex.schema.createTable("material_categories", function (table) {
    table.increments("id").primary();
    table.string("name", 50).notNullable().defaultTo("0");
    table.enum("status", ["1", "0"]).notNullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamps(true, true);
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("material_categories");
}
